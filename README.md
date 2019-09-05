# CSS-EVOLUTION

*CSS-Evolution migrate component variants to a single unified semantic HTML*

Often a single logical component has multiple variants for design purposes - ideally the only difference between the variants is their CSS, but if the variants have different DOM structure you can't switch between them using CSS selectors and/or media queries. This is often the case when variants were accumalted historically and no one enforced the unified DOM requirement or needed to support legacy browser which had poor CSS support.


Using a simple genetic algorithm to mutate CSS rules and comparing the generated pixels between the 