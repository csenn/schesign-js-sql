create table "class1" (
   "a" boolean,
   "a1" boolean not null,
   "a4" boolean,
   "a5" boolean,
   "a6" boolean,
   "b" text,
   "b1" text,
   "b2" text,
   "b3" text,
   "b4" text,
   "b5" text,
   "c" real,
   "c1" real,
   "c2" integer,
   "c3" integer,
   "c4" integer,
   "c5" integer,
   "c6" bigint,
   "c7" real,
   "c8" real,
   "d" text check ("d" in ('one',
   'two',
   '3',
   '4.5')),
   "e" date,
   "e1" date,
   "e2" time,
   "f" integer,
   "g" integer
);
alter table "class1" add constraint "class1_pkey" primary key ("a4");
alter table "class1" add constraint "class1_f_foreign" foreign key ("f") references "f" ("id");
alter table "class1" add constraint "class1_g_foreign" foreign key ("g") references "class2" ("id");

create table "class2" (
   "id" serial primary key
);

create table "f" (
   "id" serial primary key,
   "a" boolean,
   "f1" integer
);
alter table "f" add constraint "f_f1_foreign" foreign key ("f1") references "f1" ("id");

create table "f1" (
   "id" serial primary key,
   "a" boolean
);

create table "a3" (
   "id" serial primary key,
   "class1_id" integer,
   "a3" boolean
);
alter table "a3" add constraint "a3_class1_id_foreign" foreign key ("class1_id") references "class1" ("id");

create table "a2" (
   "id" serial primary key,
   "class1_id" integer,
   "a2" boolean
);
alter table "a2" add constraint "a2_class1_id_foreign" foreign key ("class1_id") references "class1" ("id");