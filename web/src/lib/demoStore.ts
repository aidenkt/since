/** In-memory stand-in for the Base44 workbook database. Nothing here makes a network call.
 *  Writes last for this page load; a reload restores the seeded sample. */
import caseStudyUrl from "../../../data/case_study_aug2026.xlsx?url";
import { DEMO_USER } from "./demoMode";

type Role = "owner" | "editor" | "viewer";
type Me = { email: string; name: string };
type Member = { email: string; role: Exclude<Role, "owner"> };
type Row = {
  doc_id: string;
  filename: string;
  owner: Me;
  members: Member[];
  updated: number;
  updated_by: string | null;
  bytes: ArrayBuffer;
};

export type DemoPerson = Me & { role: Role; cell: string | null; range: string | null; open: string | null };
export type DemoHere = { cell: string | null; range: string | null; open: string | null };
export type DemoHandlers = {
  onPeople: (people: DemoPerson[]) => void;
  onOp: (op: unknown, by: Me) => void;
  onError: (msg: string) => void;
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SEED_ID = "demo-calder";
/** Fictional colleague from the Calder & Finch case study. Not a real person. */
const SEED_OWNER: Me = { email: "priya.nandakumar@example.com", name: "Priya Nandakumar" };

const rows = new Map<string, Row>();
const visitor = (): Me => ({ email: DEMO_USER.email, name: DEMO_USER.name });

const roleOf = (row: Row, user = visitor()): Role | null =>
  row.owner.email === user.email ? "owner" : (row.members.find((m) => m.email === user.email)?.role ?? null);

const view = (row: Row) => ({
  doc_id: row.doc_id,
  filename: row.filename,
  owner: row.owner,
  members: row.members,
  role: roleOf(row)!,
  updated: row.updated,
  updated_by: row.updated_by,
});

const now = () => Date.now() / 1000;

function toBytes(b64: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function toBase64(bytes: ArrayBuffer): string {
  const viewBytes = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < viewBytes.length; i += 0x8000) s += String.fromCharCode(...viewBytes.subarray(i, i + 0x8000));
  return btoa(s);
}

let seeding: Promise<void> | null = null;
function ensureSeed(): Promise<void> {
  if (rows.has(SEED_ID)) return Promise.resolve();
  if (!seeding) {
    seeding = fetch(caseStudyUrl)
      .then((r) => {
        if (!r.ok) throw new Error("Demo sample workbook failed to load");
        return r.arrayBuffer();
      })
      .then((bytes) => {
        if (rows.has(SEED_ID)) return;
        rows.set(SEED_ID, {
          doc_id: SEED_ID,
          filename: "Calder & Finch draft.xlsx",
          owner: SEED_OWNER,
          members: [{ email: DEMO_USER.email, role: "editor" }],
          updated: Date.parse("2026-10-10T15:04:00Z") / 1000,
          updated_by: SEED_OWNER.email,
          bytes,
        });
      });
  }
  return seeding;
}

function load(id: unknown, need: Role[] = ["owner", "editor", "viewer"]): Row {
  const row = rows.get(String(id));
  const role = row ? roleOf(row) : null;
  if (!row || !role) throw new Error("No such workbook, or it isn't shared with you");
  if (!need.includes(role)) throw new Error(`Needs ${need.join(" or ")} access`);
  return row;
}

/** Same actions as the `workbooks` function, answered from memory. */
export async function demoCall<T>(action: string, args: Record<string, unknown>): Promise<T> {
  await ensureSeed();
  const user = visitor();
  switch (action) {
    case "list": {
      const mine = [...rows.values()].filter((row) => roleOf(row, user));
      return mine.map(view).sort((a, b) => b.updated - a.updated) as T;
    }
    case "create": {
      const filename = String(args.filename || "model.xlsx");
      if (typeof args.data !== "string" || !args.data) throw new Error("No file");
      const doc_id = `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const row: Row = {
        doc_id,
        filename,
        owner: user,
        members: [],
        updated: now(),
        updated_by: user.email,
        bytes: toBytes(args.data),
      };
      rows.set(doc_id, row);
      return view(row) as T;
    }
    case "get":
      return view(load(args.id)) as T;
    case "file": {
      const row = load(args.id);
      return { data: toBase64(row.bytes), filename: row.filename } as T;
    }
    case "save": {
      const row = load(args.id, ["owner", "editor"]);
      if (typeof args.data !== "string" || !args.data) throw new Error("No file");
      row.bytes = toBytes(args.data);
      row.updated = now();
      row.updated_by = user.email;
      return { updated: row.updated } as T;
    }
    case "rename": {
      const row = load(args.id, ["owner", "editor"]);
      const filename = String(args.filename ?? "").trim();
      if (!filename || filename.length > 200) throw new Error("A name needs 1 to 200 characters");
      row.filename = filename;
      row.updated = now();
      row.updated_by = user.email;
      return view(row) as T;
    }
    case "share": {
      const row = load(args.id, ["owner"]);
      const email = String(args.email ?? "").trim().toLowerCase();
      const role = args.role ?? "editor";
      if (!EMAIL.test(email)) throw new Error(`${args.email} isn't an email address`);
      if (role !== "editor" && role !== "viewer") throw new Error("Role must be editor or viewer");
      if (email === row.owner.email) throw new Error("That's the owner");
      row.members = [...row.members.filter((m) => m.email !== email), { email, role }];
      return view(row) as T;
    }
    case "unshare": {
      const row = load(args.id, ["owner"]);
      const email = String(args.email ?? "").toLowerCase();
      row.members = row.members.filter((m) => m.email !== email);
      return view(row) as T;
    }
    case "delete": {
      const row = load(args.id, ["owner"]);
      rows.delete(row.doc_id);
      return { deleted: row.doc_id } as T;
    }
    case "join": {
      const row = load(args.id);
      const role = roleOf(row)!;
      return { email: user.email, name: user.name, role } as T;
    }
    default:
      throw new Error(`Unknown action ${action}`);
  }
}

/** One tab's presence, with the seeded colleague already in the sample workbook. No socket. */
export function demoJoin(id: string, h: DemoHandlers) {
  let closed = false;
  let self: DemoPerson | null = null;
  let pending: DemoHere | null = null;

  const emit = () => {
    if (closed || !self) return;
    const people: DemoPerson[] = [];
    if (id === SEED_ID) people.push({ ...SEED_OWNER, role: "owner", cell: "P&L!C18", range: null, open: null });
    people.push(self);
    h.onPeople(people);
  };

  const start = () => {
    if (closed || self) return;
    const row = rows.get(id);
    const role = row ? roleOf(row) : null;
    if (!row || !role) {
      h.onError("No such workbook, or it isn't shared with you");
      return;
    }
    self = { ...visitor(), role, cell: pending?.cell ?? null, range: pending?.range ?? null, open: pending?.open ?? null };
    emit();
  };

  if (rows.has(SEED_ID)) start();
  else void ensureSeed().then(start);

  return {
    setHere(next: DemoHere) {
      pending = next;
      if (!self) return;
      self.cell = next.cell;
      self.range = next.range;
      self.open = next.open;
      emit();
    },
    send(_op: unknown) {},
    saved() {},
    close() {
      closed = true;
    },
  };
}
