create table "Class1" (
   "id" serial primary key,
   "property_a" integer
);
alter table "Class1" add constraint "class1_property_a_foreign" foreign key ("property_a") references "property_a" ("id");

create table "property_a" (
   "id" serial primary key,
   "property_a" integer
);
alter table "property_a" add constraint "property_a_property_a_foreign" foreign key ("property_a") references "property_a" ("id");