import { Block, GRID_COLUMNS } from "@/components/Nest";

export type PersonItem = { photo: string; alt: string; name: string; role: string };
export type PeopleProps = { items: PersonItem[]; columns: "2" | "3" | "4"; shape: "round" | "portrait" };

// People tiles stay two-up on phones even for the 2- and 3-column choices.
const PEOPLE_COLUMNS = { "2": "grid-cols-2", "3": "grid-cols-2 md:grid-cols-3", "4": GRID_COLUMNS["4"] } as const;

export function People({ items, columns, shape }: PeopleProps) {
  const people = items ?? [];
  if (people.length === 0) return null;
  const round = shape !== "portrait";
  return (
    <Block>
      <ul className={`grid gap-6 ${PEOPLE_COLUMNS[columns] ?? PEOPLE_COLUMNS["3"]}`}>
        {people.map((person, index) => (
          <li key={index} className={round ? "text-center" : ""}>
            {person.photo ? (
              <img
                src={person.photo}
                alt={person.alt}
                loading="lazy"
                className={
                  round
                    ? "mx-auto aspect-square w-full max-w-40 rounded-full object-cover"
                    : "aspect-[4/5] w-full rounded-media object-cover"
                }
              />
            ) : null}
            {person.name ? <p className="mt-3 font-display font-semibold">{person.name}</p> : null}
            {person.role ? <p className="text-small text-fg-soft">{person.role}</p> : null}
          </li>
        ))}
      </ul>
    </Block>
  );
}
