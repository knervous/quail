package rawfrag

import "io"

// WldFragUserData is empty in libeq, empty in openzone, USERDATA in wld
type WldFragUserData struct {
}

func (e *WldFragUserData) FragCode() int {
	return FragCodeUserData
}

func (e *WldFragUserData) Write(w io.Writer) error {
	return nil
}

func (e *WldFragUserData) Read(r io.ReadSeeker) error {
	return nil
}
