import asyncio
from sqlalchemy import select, delete, func

from app.core.database import AsyncSessionLocal
from app.models.dataset_models import UploadedDataset, TrainingSample

KEEP_DATASET_ID = 1
DELETE_DATASET_IDS = [2, 3, 4, 5]


async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(UploadedDataset).where(
                UploadedDataset.id.in_(DELETE_DATASET_IDS)
            )
        )
        datasets = result.scalars().all()

        found_ids = sorted(dataset.id for dataset in datasets)

        if found_ids != DELETE_DATASET_IDS:
            raise ValueError(
                f"Safety check failed. Expected IDs {DELETE_DATASET_IDS}, "
                f"but found {found_ids}. Nothing was deleted."
            )

        for dataset in datasets:
            if dataset.disease_id != "heart" or dataset.row_count != 297:
                raise ValueError(
                    f"Safety check failed for dataset ID {dataset.id}. "
                    "Nothing was deleted."
                )

        duplicate_sample_count = await session.scalar(
            select(func.count())
            .select_from(TrainingSample)
            .where(TrainingSample.dataset_id.in_(DELETE_DATASET_IDS))
        )

        print(f"Keeping dataset ID: {KEEP_DATASET_ID}")
        print(f"Deleting duplicate dataset IDs: {DELETE_DATASET_IDS}")
        print(f"Deleting duplicate training rows: {duplicate_sample_count}")

        confirmation = input("Type DELETE to continue: ")

        if confirmation != "DELETE":
            print("Cancelled. Nothing was deleted.")
            return

        await session.execute(
            delete(TrainingSample).where(
                TrainingSample.dataset_id.in_(DELETE_DATASET_IDS)
            )
        )

        await session.execute(
            delete(UploadedDataset).where(
                UploadedDataset.id.in_(DELETE_DATASET_IDS)
            )
        )

        await session.commit()

        print("Done. Dataset ID 1 was kept; duplicate uploads were removed.")


asyncio.run(main())