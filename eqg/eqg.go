package eqg

import (
	"github.com/xackery/quail/common"
)

// EQG represents a modern everquest zone archive format
type EQG struct {
	files []common.Filer
}