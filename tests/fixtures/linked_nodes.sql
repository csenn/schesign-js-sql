create table "class3_1" (
   "id" serial primary key,
   "a" integer,
   "b" integer,
   "c" integer,
   "d" integer
);
alter table "class3_1" add constraint "class3_1_a_foreign" foreign key ("a") references "class1" ("id");
alter table "class3_1" add constraint "class3_1_b_foreign" foreign key ("b") references "b" ("id");
alter table "class3_1" add constraint "class3_1_c_foreign" foreign key ("c") references "class1" ("id");
alter table "class3_1" add constraint "class3_1_d_foreign" foreign key ("d") references "class4" ("id");

create table "class4" (
   "id" serial primary key,
   "f" integer
);
alter table "class4" add constraint "class4_f_foreign" foreign key ("f") references "class3" ("id");

create table "class3" (
   "id" serial primary key,
   "d" text
);

create table "class1" (
   "id" serial primary key,
   "a" integer,
   "b" integer
);
alter table "class1" add constraint "class1_a_foreign" foreign key ("a") references "class1" ("id");
alter table "class1" add constraint "class1_b_foreign" foreign key ("b") references "b" ("id");

create table "b" (
   "id" serial primary key,
   "e" integer
);
alter table "b" add constraint "b_e_foreign" foreign key ("e") references "class2" ("id");

create table "class2" (
   "id" serial primary key,
   "a" integer,
   "c" text
);
alter table "class2" add constraint "class2_a_foreign" foreign key ("a") references "class1" ("id");