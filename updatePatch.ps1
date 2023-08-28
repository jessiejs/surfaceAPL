node ./updateVersionWithoutGit.mjs patch
gut commit
git push
./publishPrivate
node ./getGitCommitText.mjs
