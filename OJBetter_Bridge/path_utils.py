import os


def resolve_path_within(base_directory, *path_parts):
    """Resolve a relative path and ensure it stays inside base_directory."""
    base_path = os.path.realpath(os.fspath(base_directory))

    relative_parts = []
    for part in path_parts:
        part = os.fspath(part)
        if not isinstance(part, str):
            raise TypeError("Path components must be strings")
        if os.path.isabs(part):
            raise ValueError("Absolute paths are not allowed")
        relative_parts.append(part)

    resolved_path = os.path.realpath(os.path.join(base_path, *relative_parts))
    base_prefix = base_path
    if not base_prefix.endswith(os.sep):
        base_prefix += os.sep

    if resolved_path.startswith(base_prefix):
        return resolved_path

    raise ValueError("Path escapes the allowed directory")
