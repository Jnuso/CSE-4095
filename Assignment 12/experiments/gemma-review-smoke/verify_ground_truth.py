"""Confirm known defects/controls locally, without API calls or model output execution."""

from cases import accuracy_a, accuracy_b, append_c, append_d


def main():
    assert accuracy_a(2, 3) == 66
    assert accuracy_a(1, 8) == 12
    assert accuracy_b(2, 3) == 67
    assert accuracy_b(1, 8) == 13
    assert accuracy_a(0, 0) == accuracy_b(0, 0) == 0
    assert accuracy_b(0, 3) == 0
    assert accuracy_b(3, 3) == 100

    original = [{"id": "q1", "correct": False}]
    repeated = {"id": "q1", "correct": True}
    assert len(append_c(original, repeated)) == 2
    assert len(append_d(original, repeated)) == 1
    assert append_d(original, repeated)[0]["correct"] is False
    assert len(append_d(original, {"id": "q2", "correct": True})) == 2
    assert original == [{"id": "q1", "correct": False}]
    # Independently check the concrete example returned by the external reviewer.
    sample = [{"id": "1", "v": 1}]
    assert append_c(sample, {"id": "1", "v": 2}) == [
        {"id": "1", "v": 1}, {"id": "1", "v": 2}
    ]
    assert append_d(sample, {"id": "1", "v": 2}) == sample
    print("Ground truth confirmed: A and C violate requirements; B and D are correct controls.")
    print("This local verification made no API requests and executed no external model output.")


if __name__ == "__main__":
    main()
