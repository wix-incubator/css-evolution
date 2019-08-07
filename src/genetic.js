import {randomInt} from './random'

const population = 50;
const surivors = 10;

export function initPool(spawn) {
    const pool = new Array(surivors).fill().map(() => {
        const genes = spawn();
        return {
            genes,
            generation: 0,
            score: 0,
        }
    });
    return {pool, generation: 0}
}

function sortCompare(a,b) {
    if (a.score < b.score) {
        return -1;
    } else if (a.score === b.score) {
        return 0;
    }
    return 1;
}

export async function evolvePool({pool, generation}, fitness, mutate) {
    generation += 1;
    while (pool.length < population) {
        const parentA = pool[randomInt(pool.length)].genes;
        const parentB = pool[randomInt(pool.length)].genes;
        const genes = mutate(parentA, parentB);
        pool.push({genes, generation: generation})
    }
    await Promise.all(pool.map(async indiv => {
        indiv.score = indiv.score || await fitness(indiv.genes);
        return indiv.score
    }))
    
    pool = pool.sort(sortCompare);
    pool = pool.slice(0, surivors);

    // console.log(pool)

    return {pool, generation};
}