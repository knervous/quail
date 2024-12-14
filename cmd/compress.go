package cmd

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"github.com/xackery/quail/helper"
	"github.com/xackery/quail/os"
	"github.com/xackery/quail/pfs"
)

func init() {
	rootCmd.AddCommand(compressCmd)
	compressCmd.PersistentFlags().String("path", "", "path to compress")
	compressCmd.PersistentFlags().String("out", "", "name of compressed eqg archive output, defaults to path's basename")
	compressCmd.Example = `quail compress --path="./_clz.eqg/"
quail compress ./_soldungb.eqg/
quail compress _soldungb.eqg/ common.eqg
quail compress --path=_soldungb.eqg/ --out=foo.eqg`
}

// compressCmd represents the compress command
var compressCmd = &cobra.Command{
	Use:   "compress",
	Short: "Compress an eqg/s3d/pfs/pak folder named _file.ext/ to a pfs archive",
	Long:  `Compress is used to take a provided _file.eqg or _file.s3d and compress it based on a folder structure`,
	Run:   runCompress,
}

func runCompress(cmd *cobra.Command, args []string) {
	err := runCompressE(cmd, args)
	if err != nil {
		log.Printf("Failed: %s", err.Error())
		os.Exit(1)
	}
}

func runCompressE(cmd *cobra.Command, args []string) error {
	path, err := cmd.Flags().GetString("path")
	if err != nil {
		return fmt.Errorf("parse path: %w", err)
	}
	if path == "" {
		if len(args) < 1 {
			return cmd.Usage()
		}
		path = args[0]
	}
	defer func() {
		if err != nil {
			fmt.Println("Error:", err)
			os.Exit(1)
		}
	}()
	out, err := cmd.Flags().GetString("out")
	if err != nil {
		return fmt.Errorf("parse out: %w", err)
	}
	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("parse absolute path: %w", err)
	}
	if out == "" {
		if len(args) < 2 {
			out = filepath.Base(absPath)
		} else {
			out = args[1]
		}
	}

	out = strings.ToLower(out)

	isValid := false
	for _, ext := range []string{".eqg", ".s3d", ".pfs", ".pak"} {
		if strings.HasSuffix(out, ext) {
			isValid = true
			break
		}
	}
	if !isValid {
		return fmt.Errorf("out must have a valid extension (.eqg, .s3d, .pfs, .pak)")
	}
	out = strings.TrimPrefix(out, "_")
	err = compress(path, out)
	if err != nil {
		return err
	}
	return nil
}

func compress(path string, out string) error {
	if strings.HasSuffix(out, ".eqg") {
		return compressPfs(path, out)
	}
	if strings.HasSuffix(out, ".s3d") {
		return compressPfs(path, out)
	}
	if strings.HasSuffix(out, ".pfs") {
		return compressPfs(path, out)
	}
	if strings.HasSuffix(out, ".pak") {
		return compressPfs(path, out)
	}

	out = out + ".eqg"
	return compressPfs(path, out)
}

func compressPfs(path string, out string) error {
	fi, err := os.Stat(path)
	if err != nil {
		return fmt.Errorf("path check: %w", err)
	}
	if !fi.IsDir() {
		return fmt.Errorf("path invalid, must be a directory (%s)", path)
	}

	archive := &pfs.Pfs{}
	files, err := os.ReadDir(path)
	if err != nil {
		return fmt.Errorf("readdir path: %w", err)
	}
	if len(files) == 0 {
		return fmt.Errorf("no files found in %s to add to archive %s", path, out)
	}

	addStdout := ""
	fileCount := 0
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if file.Name() == ".DS_Store" {
			continue
		}
		fileCount++

		data, err := os.ReadFile(fmt.Sprintf("%s/%s", path, file.Name()))
		if err != nil {
			return fmt.Errorf("read %s: %w", file.Name(), err)
		}
		err = archive.Add(file.Name(), data)
		if err != nil {
			return fmt.Errorf("add %s: %w", file.Name(), err)
		}
		addStdout += file.Name() + ", "
	}
	if fileCount == 0 {
		return fmt.Errorf("no files found to add")
	}
	addStdout = addStdout[0:len(addStdout)-2] + "\n"

	w, err := os.Create(out)
	if err != nil {
		return fmt.Errorf("create %s: %w", out, err)
	}
	defer w.Close()
	err = archive.Write(w)
	if err != nil {
		return fmt.Errorf("encode %s: %w", out, err)
	}

	fmt.Printf("%s\n%d file%s written to %s\n", addStdout, fileCount, helper.Pluralize(fileCount), out)
	return nil
}
