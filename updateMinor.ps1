node ./updateVersionWithoutGit.mjs minor
gut commit
git push
./publishPrivate
node ./getGitCommitText.mjs
