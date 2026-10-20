from pathlib import Path


ALLOWED_EXTENSIONS = {".pdf", ".docx"}

MAX_FILE_SIZE = 15 * 1024 * 1024


def validate_file_extension(filename: str) -> bool:
    extension = Path(filename).suffix.lower()

    return extension in ALLOWED_EXTENSIONS


def validate_file_size(file_size: int) -> bool:
    return file_size <= MAX_FILE_SIZE