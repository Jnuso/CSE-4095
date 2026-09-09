"""Backward-compatible Fibonacci entry point. Use benford.py for new work."""

import sys

from benford import main


if __name__ == "__main__":
    main(["fibonacci", *sys.argv[1:]])
