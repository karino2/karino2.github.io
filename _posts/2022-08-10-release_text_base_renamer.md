---
title: TextBaseRenamer, Bulk Android file rename app based on the plain text for Android
layout: page
---
I release TextBaserRenamer. [TextBaseRenamer - Apps on Google Play](https://play.google.com/store/apps/details?id=io.github.karino2.textbaserenamer)

TextBaseRenamer is an Android bulk file rename app.
After you launch the app and choose the target folder, the app shows two text areas named "Before" and "After", with file names in both panes.

![before, scresnshot](https://raw.githubusercontent.com/karino2/TextBaseRenamer/main/misc/home_portrait.png)


You can edit the "After" pane for new names.
Then this app scans both panes line by line and renames files of the name that matches the "Before" line to the "After" line.
Almost like calling `"mv $Before.line[n] $After.line[n]"`.

![after, scresnshot](https://raw.githubusercontent.com/karino2/TextBaseRenamer/main/misc/home_portrait_after.png)

If you delete lines from both panes, the app skips those files.

This app does not provide text-replacing features like adding sequential numbers, regex replacement, etc.
You can use any text editing app you want for editing the "After" pane.
