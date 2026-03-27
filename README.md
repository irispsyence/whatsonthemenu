# What's on the Menu?

Single-page scrolling website for a cottage bakery — informational, mobile-first, no ecommerce.

## Changing the seasonal section

`js/main.js` — top of the file, first variable:

```js
const currentSeason = 'spring'; // change to: spring | summer | fall | winter
```

Change this value and run `./deploy.sh` when the baker confirms the seasonal menu is ready. Season changes are intentional and manual — do not automate this.

## TODO: Section dividers

Come back to the section dividers — current implementation is functional but needs design work. Revisit placement (currently sitting inside the top of each card) and artistic treatment. Consider something more in keeping with the bakery aesthetic.
