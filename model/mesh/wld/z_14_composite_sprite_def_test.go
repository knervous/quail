package wld

import (
	"testing"
)

// TOO: no refs
func TestWLD_compositeSpriteDefRead(t *testing.T) {
	e, err := New("test", nil)
	if err != nil {
		t.Fatalf("new: %v", err)
		return
	}
	fragmentTests(t,
		true, //single run stop
		[]string{
			"gequip.s3d",
		},
		14,                       //fragCode
		-1,                       //fragIndex
		e.compositeSpriteDefRead) //callback
}