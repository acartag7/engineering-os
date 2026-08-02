package greeting

import "testing"

func TestMessage(t *testing.T) {
	if got, want := Message(), "engineering-os-go-fixture"; got != want {
		t.Fatalf("Message() = %q, want %q", got, want)
	}
}
