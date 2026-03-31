APP_NAME  := SubtitleBlocker
BUILD_DIR := .build/release
APP_BUNDLE := $(APP_NAME).app

.PHONY: build bundle run clean

build:
	swift build -c release

bundle: build
	@echo "Creating $(APP_BUNDLE)…"
	@rm -rf "$(APP_BUNDLE)"
	@mkdir -p "$(APP_BUNDLE)/Contents/MacOS"
	@mkdir -p "$(APP_BUNDLE)/Contents/Resources"
	@cp "$(BUILD_DIR)/$(APP_NAME)" "$(APP_BUNDLE)/Contents/MacOS/"
	@cp "Resources/Info.plist"     "$(APP_BUNDLE)/Contents/"
	@echo "Done — open $(APP_BUNDLE)"

run: bundle
	@open "$(APP_BUNDLE)"

clean:
	@rm -rf .build "$(APP_BUNDLE)"
