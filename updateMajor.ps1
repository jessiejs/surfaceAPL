node ./updateVersionWithoutGit.mjs major
gut commit
git push
./publishPrivate
node ./getGitCommitText.mjs
