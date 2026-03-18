# Secure Build Notes

## Implemented Now

The following first-pass consistency changes are now implemented in code:

1. Heal room

- `Heal 30%` or `Purge 1 card`.

2. Normal rewards

- `2` cards biased toward the current biome, then `1` wildcard fill.

3. Merchant

- `1` purge paid with gold.
- `1` purge paid with HP.
- extra purge relic still adds one more gold purge.

4. Archetype tags

- Added reusable archetype tags on cards:
  - `BLEED`
  - `BLOCK`
  - `EXHAUST`
  - `HEAL`
  - `INK`
- Tags can be explicit on card data or inferred from effects.

5. Archetype events

- Added archetype-focused events that let the player choose a direction,
  then pick `1` card among `3` coherent offers when available.
- Current event sets include combinations around:
  - `BLEED`
  - `BLOCK`
  - `EXHAUST`
  - `HEAL`
  - `INK`

6. Reward weighting by current build

- Combat card rewards now slightly favor cards that match what the deck is
  already doing.
- If the current deck already leans toward an archetype, matching offers gain
  extra weight.

7. Low-HP sustain weighting

- When player HP is low, healing/sustain cards get a visible weight increase
  in combat rewards.

8. Floor map rework

- The floor map now uses a connected graph structure inspired by Slay the Spire.
- Runs now use `3` floors instead of `5`.
- Floors now have `16` depths instead of `10`.
- The graph keeps:
  - first room = combat
  - pre-boss room before boss
  - boss room at the end
- Paths now create real routing decisions instead of only local per-column choice.
- Graph routing is now stricter so the player cannot more or less reach
  everything from everywhere.
- Special rooms now persist their role on the map (`EVENT`, `HEAL`, `UPGRADE`)
  instead of being fully opaque.
- Path lines are rendered explicitly between nodes, including for older runs
  that do not yet have serialized graph edges.

## Current Problem

The game feels too hard around difficulty 1 / floor 2, even with multiple story unlocks.

Likely causes:

- Difficulty scaling itself is not the main issue.
- Build consistency is too low.
- Deck correction tools are too limited.
- Unlocking more cards may currently dilute rewards more than it helps.

## Observations

### Difficulty

- Base player start is still lean:
  - `60 HP`
  - `3 energy`
  - `4 draw`
  - `0 gold`
- Difficulty 1 only raises enemies moderately:
  - HP multiplier `1.12`
  - damage multiplier `1.10`

Conclusion:

- The problem is probably not raw enemy overtuning alone.
- The bigger issue is low agency to make a coherent build.

### Reward dilution

Normal combat rewards currently bias only one card toward the current biome, then fill the rest from off-biome options.

That means:

- the more cards are unlocked, the less stable the build becomes
- sustain/archetype pieces are harder to find
- players get more "interesting" choices, but fewer "useful for this run" choices

### Merchant correction is weak

Merchant correction tools are expensive relative to the current economy.

Examples:

- start gold is `0`
- merchant cards are expensive early
- purge is expensive
- by default there is only one purge per visit

So if the run drifts, the player has few ways to recover.

### Sustain exists, but is too diluted

Healing cards do exist across multiple biomes and pools, but they are not seen often enough.

The issue is likely:

- visibility / offer frequency
- reward dilution
- not enough ways to intentionally pivot into sustain

## Ideas Discussed

### High-priority tuning changes

1. Heal room:

- Offer `Heal 30%` or `Purge 1 card`.

2. Normal rewards:

- Offer `2 cards from current biome + 1 wildcard`
- instead of `1 current biome + 2 off-biome`.

3. Merchant:

- Add a second purge option per visit.
- First purge costs gold.
- Second purge costs HP.

4. After that:

- Add archetype events to reinforce chosen builds.

### Archetype / keyword events

Events that let the player choose a keyword or archetype, then pick from 3 related cards.

Example archetypes:

- poison
- bleed
- armor / block
- exhaust
- heal / sustain
- ink

Better implementation note:

- use explicit archetype tags, not raw keyword string matching
- easier to tune and reuse later in rewards / deck weighting

### More purge access

Possible options:

- some events directly purge
- heal room can trade heal for purge
- merchant can allow one additional purge through HP sacrifice

### Other ways to stabilize builds

- lower merchant purge price a bit
- give more weight to cards matching what the deck is already doing
- if player HP is low, increase sustain offer chance slightly
- on floors 1-2, reduce off-biome dilution

## Newly Implemented Outcome

The previous "next step" items are now in:

- archetype tags on cards
- archetype-based special events
- reward weighting based on current deck
- low-HP sustain weighting

That means the next real step is no longer implementation of those systems,
but focused playtesting and tuning:

- Are archetype events appearing often enough?
- Are the offered cards coherent enough for each character?
- Is low-HP sustain weighting strong enough to be felt?
- Do normal rewards now feel more reliable without becoming too scripted?

## Floor Map Question

### Current map structure

Previous structure:

- `10` rooms total
- room `0`: always combat
- rooms `1-7`: mixed middle rooms
- room `8`: always pre-boss
- room `9`: always boss

This section is now outdated as a description of the live codebase.

### New implemented structure

Per floor:

- `16` depths total
- depth `0`: always combat
- depths `1-13`: connected graph nodes
- depth `14`: always pre-boss
- depth `15`: always boss

Per run:

- `3` floors total

The map is now a real graph:

- nodes have lanes
- nodes connect only to next-depth nodes
- player path depends on previous node choice
- current reachable nodes are restricted by graph connections

Graph goals now implemented:

- real route planning
- early, mid, and late correction nodes on valid paths
- limited merchant count
- safe and greedy routes can coexist
- special rooms keep their identity after save/reload because the map is stored
  in the run state

### Remaining tuning questions

Still to evaluate by playtest:

- Are there enough safe paths?
- Are greedy paths too rewarding?
- Are there too many or too few correction opportunities?
- Do we want even more graph templates so route shapes vary more between runs?

## Implementation Order Agreed

Immediate:

- heal room = heal or purge
- normal rewards = 2 biome + 1 wildcard
- merchant = second purge paid with HP

Then:

- archetype events
- reward weighting based on current deck
- low-HP sustain weighting
- early-floor off-biome dilution reduction

Later:

- tune graph quotas and path guarantees after playtests
