import os
import sys
import tempfile
import unittest
from pathlib import Path


BRIDGE_DIRECTORY = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BRIDGE_DIRECTORY))

from path_utils import resolve_path_within


class ResolvePathWithinTests(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary_directory.name) / "bridge"
        self.root.mkdir()

    def tearDown(self):
        self.temporary_directory.cleanup()

    def test_allows_nested_path_inside_base_directory(self):
        resolved_path = resolve_path_within(
            self.root, "java_workspace", "hello/src/123.java")

        self.assertEqual(
            resolved_path,
            os.path.realpath(self.root / "java_workspace/hello/src/123.java")
        )

    def test_rejects_parent_directory_traversal(self):
        with self.assertRaises(ValueError):
            resolve_path_within(self.root, "cpp_workspace", "../../outside.txt")

    def test_rejects_sibling_directory_with_the_same_prefix(self):
        with self.assertRaises(ValueError):
            resolve_path_within(self.root, "../bridge-unsafe", "outside.txt")

    def test_rejects_absolute_path(self):
        with self.assertRaises(ValueError):
            resolve_path_within(self.root, Path(self.temporary_directory.name) / "outside.txt")

    @unittest.skipUnless(hasattr(os, "symlink"), "symbolic links are unavailable")
    def test_rejects_symbolic_link_escape(self):
        outside_directory = Path(self.temporary_directory.name) / "outside"
        outside_directory.mkdir()
        (self.root / "linked_workspace").symlink_to(
            outside_directory, target_is_directory=True)

        with self.assertRaises(ValueError):
            resolve_path_within(self.root, "linked_workspace", "outside.txt")


if __name__ == "__main__":
    unittest.main()
