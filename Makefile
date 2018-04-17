ESLINT_FILES = $(shell ls -S `find . -type f -not -path "./config/*" -not -path "./test/*" -not -path "*/node_modules/*" -name "*.js"`)
TEST = $(shell ls -S `find test -type f -name "*.test.js"`)

test:
	@node --harmony ./node_modules/.bin/mocha $(TEST) \
	     -t 10000

eslint:
	@echo 'eslint doing...'
	@if [ ! -f "./node_modules/.bin/eslint" ]; then \
    npm install eslint eslint-config-aliyun eslint-plugin-react --registry=https://registry.npm.taobao.org; \
  fi
	@./node_modules/.bin/eslint --lint --fix ${ESLINT_FILES}
	@echo 'eslint done!'

install:
	@tnpm i

.PHONY: test eslint install

