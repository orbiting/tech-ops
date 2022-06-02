# ops-trell

Run `yarn` to setup.

## Archive "elderly" Trello cards

Run script with a board ID. It defaults to a dry run, so script prints what it _would_ do.

```
$ bin/archiveCards.js --board 123123123
```

If results are the results you're looking for, drop dry run.

Pro tip: In case something goes horribly wrong, redirect output into a text file. 

```
$ bin/archiveCards.js --board 123123123 --no-dry-run > ./closed.txt
```
