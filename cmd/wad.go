/*
Copyright © 2023 NAME HERE <EMAIL ADDRESS>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/xackery/quail/log"
	"github.com/xackery/quail/quail"
)

func init() {
	rootCmd.AddCommand(wadCmd)
}

// wadCmd represents the wad command
var wadCmd = &cobra.Command{
	Use:   "wad",
	Short: "Convert wld <-> wad",
	Long:  `Supports s3d, wld and wad files`,
	RunE:  runWad,
}

func runWad(cmd *cobra.Command, args []string) error {
	err := runWadE(cmd, args)
	if err != nil {
		log.Printf("Failed: %s", err.Error())
		os.Exit(1)
	}
	return nil
}

func runWadE(cmd *cobra.Command, args []string) error {
	if len(args) < 2 {
		fmt.Println("Usage: quail wad <src> <dst>")
		os.Exit(1)
	}
	log.SetLogLevel(0)
	srcPath := args[0]
	dstPath := args[1]
	fi, err := os.Stat(srcPath)
	if err != nil {
		return fmt.Errorf("stat: %w", err)
	}
	srcExt := filepath.Ext(srcPath)
	if fi.IsDir() && srcExt != ".quail" {
		return fmt.Errorf("wad: srcPath is %s but also a directory. Set to a file for this extension", srcExt)
	}

	q := quail.New()

	if srcExt == ".quail" {
		err = q.DirRead(srcPath)
		if err != nil {
			return fmt.Errorf("dir read: %w", err)
		}
	} else {
		err = q.PfsRead(srcPath)
		if err != nil {
			return fmt.Errorf("pfs read: %w", err)
		}
	}

	dstExt := filepath.Ext(dstPath)
	if dstExt == ".quail" {
		err = q.DirWrite(dstPath)
		if err != nil {
			return fmt.Errorf("dir write: %w", err)
		}
		return nil
	}
	err = q.PfsWrite(1, 1, dstPath)
	if err != nil {
		return fmt.Errorf("pfs write: %w", err)
	}

	return nil
}
