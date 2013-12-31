build: components index.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	@rm -fr build components template.js

wclean:
	@rd /S /Q build
	@rd /S /Q components
	@del template.js

.PHONY: clean
