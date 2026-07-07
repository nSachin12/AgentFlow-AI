from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)


class StorageService:

    BUCKET_NAME = "documents"

    @staticmethod
    def upload_document(
        file_name: str,
        file_bytes: bytes
    ):
        path = f"documents/{file_name}"

        supabase.storage.from_(
            StorageService.BUCKET_NAME
        ).upload(
            path,
            file_bytes,
            {
                "content-type":
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        )

        response = (
            supabase.storage
            .from_(StorageService.BUCKET_NAME)
            .get_public_url(path)
        )

        return response