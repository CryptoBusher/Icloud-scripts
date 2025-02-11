import json
from sys import stderr
import asyncio
from pathlib import Path
from random import randint
from dataclasses import dataclass

from loguru import logger
import httpx

from config import config


def set_logger():
    logger.remove()
    log_format = "<white>{time:YYYY-MM-DD HH:mm:ss}</white> | <level>{level: <8}</level> | <white>{message}</white>"
    logger.add(stderr,
               level="INFO",
               format=log_format)

    logger.add(Path("logs") / "app_{time:YYYY-MM-DD}.log",
               level="DEBUG",
               format=log_format,
               rotation="00:00",
               retention="7 days",
               compression="zip")


class EmailsLimitReachedException(Exception):
    pass

class BatchLimitReachedException(Exception):
    pass


@dataclass
class IcloudAccount:
    name: str
    proxy: str
    clientBuildNumber: str
    clientMasteringNumber: str
    clientId: str
    dsid: str
    cookies: dict[str, str]
    headers: dict[str, str]


class IcloudEmailManager:
    BASE_URL = 'https://icloud-account.icloudapp.net/'
    MAX_EMAILS = 750
    BATCH_SIZE = 5
    BATCH_DELAY_HOURS = 1
    API_CALL_DELAYS_SEC = [5, 15]

    def __init__(self, account: IcloudAccount):
        self.account = account
        self.client = None

    async def create_client(self):
        self.client = httpx.AsyncClient(
            headers=self.account.headers,
            cookies=self.account.cookies,
            proxy=self.account.proxy if self.account.proxy else None,
            timeout=30
        )

    async def _generate_new_email_domain(self) -> str:
        url = 'https://p57-maildomainws.icloud.com/v1/hme/generate'
        data = {"langCode": "en-us"}
        params = {
            'clientBuildNumber': self.account.clientBuildNumber,
            'clientMasteringNumber': self.account.clientMasteringNumber,
            'clientId': self.account.clientId,
            'dsid': self.account.dsid,
        }

        await asyncio.sleep(randint(*self.API_CALL_DELAYS_SEC))
        response = await self.client.post(url, json=data, params=params)
        response.raise_for_status()

        json_response = response.json()
        if not json_response["success"]:
            raise Exception(f'Failed to get new domain, reason: {json_response}')

        return json_response["result"]["hme"]

    @staticmethod
    def find_available_email_labels(email_list: list[tuple[str, str]]) -> list[int]:
        available_labels = list(range(1, IcloudEmailManager.MAX_EMAILS + 1))
        existing_numeric_labels = sorted(int(name) for name, email in email_list if name.isdigit())

        available_labels = list(set(available_labels) - set(existing_numeric_labels))
        available_labels.sort()

        if not available_labels:
            raise EmailsLimitReachedException()

        available_emails_count = IcloudEmailManager.MAX_EMAILS - len(email_list)
        if available_emails_count == 0:
            raise EmailsLimitReachedException()

        return available_labels[:available_emails_count]

    async def fetch_registered_emails(self) -> list[tuple[str, str]]:
        url = 'https://p57-maildomainws.icloud.com/v2/hme/list'
        params = {
            'clientBuildNumber': self.account.clientBuildNumber,
            'clientMasteringNumber': self.account.clientMasteringNumber,
            'clientId': self.account.clientId,
            'dsid': self.account.dsid,
        }

        await asyncio.sleep(randint(*self.API_CALL_DELAYS_SEC))
        response = await self.client.get(url, params=params)
        response.raise_for_status()

        json_response = response.json()
        if not json_response["success"]:
            raise Exception(f'Failed to get emails list, reason: {json_response["error"]["errorMessage"]}')

        email_objects = json_response["result"]["hmeEmails"]
        return [(e["label"], e["hme"]) for e in email_objects]

    async def register_new_email(self, label: str) -> None:
        domain = await self._generate_new_email_domain()

        url = 'https://p57-maildomainws.icloud.com/v1/hme/reserve'
        data = {
            "hme": domain,
            "label": label,
            "note": ""
        }
        params = {
            'clientBuildNumber': self.account.clientBuildNumber,
            'clientMasteringNumber': self.account.clientMasteringNumber,
            'clientId': self.account.clientId,
            'dsid': self.account.dsid,
        }

        await asyncio.sleep(randint(*self.API_CALL_DELAYS_SEC))
        response = await self.client.post(url, json=data, params=params)
        response.raise_for_status()

        json_response = response.json()
        if not json_response["success"]:
            if json_response["error"]["errorCode"] == "-41015":
                raise BatchLimitReachedException()
            else:
                raise Exception(f'Failed to register domain: {domain}, reason: {json_response["error"]["errorMessage"]}')

        logger.success(f'{self.account.name} - registered domain: {domain}')

    async def close(self):
        await self.client.aclose()


async def register_accounts(icloud_manager: IcloudEmailManager):
    await icloud_manager.create_client()

    try:
        while True:
            try:
                registered_emails = await icloud_manager.fetch_registered_emails()

                if len(registered_emails) == icloud_manager.MAX_EMAILS:
                    break

                available_labels = icloud_manager.find_available_email_labels(registered_emails)
                logger.info(f'{icloud_manager.account.name} - total available labels: {len(available_labels)}')

                registered_count = len(registered_emails)
                available_count = len(available_labels)

                for label in available_labels[:icloud_manager.BATCH_SIZE]:
                    try:
                        await icloud_manager.register_new_email(str(label))
                        registered_count += 1
                        available_count -= 1
                        continue
                    except EmailsLimitReachedException:
                        return
                    except BatchLimitReachedException:
                        print(f'{icloud_manager.account.name} - batch limit reached')
                        break
                    except Exception as e:
                        logger.error(f'{icloud_manager.account.name} - {e}')
                        continue

                logger.info(f'{icloud_manager.account.name} registered {registered_count}, available {available_count}')

            except Exception as e:
                logger.error(f'{icloud_manager.account.name} - {e}')
                continue
            finally:
                delay_sec = (icloud_manager.BATCH_DELAY_HOURS * 60 * 60) + randint(10, 300)
                logger.info(f'{icloud_manager.account.name} - sleeping {delay_sec} seconds')
                await asyncio.sleep(delay_sec)
    finally:
        await icloud_manager.close()


async def main():
    tasks = []
    for acc_config_raw in config:
        icloud_account = IcloudAccount(**acc_config_raw)
        manager = IcloudEmailManager(icloud_account)
        tasks.append(register_accounts(manager))

    await asyncio.gather(*tasks)


if __name__ == '__main__':
    set_logger()
    asyncio.run(main())
