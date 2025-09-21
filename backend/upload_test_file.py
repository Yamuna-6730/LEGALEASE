from google.cloud import storage

def upload_file(bucket_name, source_file_path, destination_blob_name):
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_path)

    print(f"File {source_file_path} uploaded to {destination_blob_name}.")

if __name__ == "__main__":
    upload_file(
        bucket_name="legal-ease-documents-resources",
        source_file_path="C:/path/to/your/local/test.docx",  # Put your actual file path here
        destination_blob_name="test_upload/test.docx"
    )
