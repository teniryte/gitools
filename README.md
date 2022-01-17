# gitools

GIT Tools

## Installation

```sh
sudo npm install --global gitools;
```

## Find repositories

Find repositories recursively:

```sh
gitools find [directories-to-find];
```

## Show origins

```sh
gitools origins [directories-to-find];
```

## Show statuses

```sh
gitools statuses [directories-to-find];
```

## Show statistics

```sh
gitools stats [directories-to-find];
```

## Change origin host of all found repositories

```sh
gitools change-origin-host <from-host> <to-host> [directories-to-find];
```

## Commit, push and publish

```sh
gitools publish [directories-to-find];
```
