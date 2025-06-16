CREATE TABLE public.assignment (
  assignment_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  subject_id integer NULL,
  description text NOT NULL,
  file_url text NULL,
  faculty_id integer NULL,
  course_id integer NOT NULL,
  semester_id integer NULL,
  assignment_name text NULL,
  uploaded_at date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT assignment_pkey PRIMARY KEY (assignment_id),
  CONSTRAINT assignment_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT assignment_faculty_id_fk FOREIGN KEY (faculty_id) REFERENCES public.faculty(fid),
  CONSTRAINT assignment_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semester(sid),
  CONSTRAINT assignment_subject_id_fk FOREIGN KEY (subject_id) REFERENCES public.subject(subject_code)
);
CREATE UNIQUE INDEX IF NOT EXISTS assignment_primary ON public.assignment USING btree (assignment_id);
CREATE INDEX IF NOT EXISTS assignment_subject_id ON public.assignment USING btree (subject_id);

CREATE TABLE public.attendance (
  attendance_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  student_id integer NULL,
  faculty_id integer NULL,
  course_id integer NULL,
  semester_id integer NULL,
  division_id integer NULL,
  subject_id integer NULL,
  attendance_date date NULL,
  status text NULL,
  total_lectures integer NULL,
  CONSTRAINT attendance_pkey PRIMARY KEY (attendance_id),
  CONSTRAINT attendance_division_id_fk FOREIGN KEY (division_id) REFERENCES public.division(did),
  CONSTRAINT attendance_faculty_id_fk FOREIGN KEY (faculty_id) REFERENCES public.faculty(fid),
  CONSTRAINT attendance_course_id_fk FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT attendance_semester_id_fk FOREIGN KEY (semester_id) REFERENCES public.semester(sid),
  CONSTRAINT attendance_student_id_fk FOREIGN KEY (student_id) REFERENCES public.student(sid) ON DELETE CASCADE,
  CONSTRAINT attendance_subject_id_fk FOREIGN KEY (subject_id) REFERENCES public.subject(subject_code)
);
CREATE UNIQUE INDEX IF NOT EXISTS attendance_primary ON public.attendance USING btree (attendance_id);

CREATE TABLE public.course (
  cid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  course_name text NOT NULL,
  CONSTRAINT course_pkey PRIMARY KEY (cid)
);
CREATE UNIQUE INDEX IF NOT EXISTS course_primary ON public.course USING btree (cid);

CREATE TABLE public.division (
  did bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  division_name text NOT NULL,
  CONSTRAINT division_pkey PRIMARY KEY (did)
);
CREATE UNIQUE INDEX IF NOT EXISTS division_primary ON public.division USING btree (did);

CREATE TABLE public.faculty (
  fid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  contact text NULL,
  password text NULL,
  birthdate date NULL,
  email text NULL,
  department text NULL,
  updated_at timestamp without time zone NULL,
  CONSTRAINT faculty_pkey PRIMARY KEY (fid)
);
CREATE UNIQUE INDEX IF NOT EXISTS faculty_primary ON public.faculty USING btree (fid);

CREATE TABLE public.gallery_images (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text NULL,
  image_path text NOT NULL,
  created_at date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT gallery_images_pkey PRIMARY KEY (id)
);

CREATE TABLE public.grades (
  gid bigserial NOT NULL,
  student_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  semester_id bigint NOT NULL,
  course_id bigint NOT NULL,
  internal_marks integer NULL,
  created_at date NOT NULL,
  updated_at date NOT NULL,
  division_id integer NULL,
  CONSTRAINT grades_pkey PRIMARY KEY (gid),
  CONSTRAINT grades_unique UNIQUE (student_id, subject_id, semester_id),
  CONSTRAINT grades_course_id_fk FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT grades_student_id_fk FOREIGN KEY (student_id) REFERENCES public.student(sid) ON DELETE CASCADE,
  CONSTRAINT grades_subject_id_fk FOREIGN KEY (subject_id) REFERENCES public.subject(subject_code),
  CONSTRAINT grades_semester_id_fk FOREIGN KEY (semester_id) REFERENCES public.semester(sid),
  CONSTRAINT grades_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.division(did)
);

CREATE TABLE public.lostandfound (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  item_name text NOT NULL,
  description text NOT NULL,
  date_lost date NOT NULL,
  location_lost text NOT NULL,
  contact_info text NOT NULL,
  image_path text NOT NULL,
  date_reported timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  found boolean NOT NULL,
  CONSTRAINT lostandfound_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notice (
  id bigserial NOT NULL,
  title text NULL,
  description text NULL,
  course_id integer NULL,
  semester_id integer NULL,
  file_url text NULL,
  CONSTRAINT notice_pkey PRIMARY KEY (id),
  CONSTRAINT notice_course_id_fk FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT notice_semester_id_fk FOREIGN KEY (semester_id) REFERENCES public.semester(sid)
);

CREATE TABLE public.semester (
  sid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  number smallint NOT NULL,
  CONSTRAINT semester_pkey PRIMARY KEY (sid)
);
CREATE UNIQUE INDEX IF NOT EXISTS semester_primary ON public.semester USING btree (sid);

CREATE TABLE public.student (
  sid bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  course_id integer NULL,
  contact text NULL,
  password text NULL,
  semester_id integer NULL,
  division_id integer NULL,
  birthdate date NULL,
  email text NULL,
  profile_pic_image_url text NULL,
  fees_status boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_pkey PRIMARY KEY (sid),
  CONSTRAINT student_course_id_fk FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT student_division_id_fk FOREIGN KEY (division_id) REFERENCES public.division(did),
  CONSTRAINT student_semester_id_fk FOREIGN KEY (semester_id) REFERENCES public.semester(sid)
);
CREATE UNIQUE INDEX IF NOT EXISTS student_primary ON public.student USING btree (sid);

CREATE TABLE public.subject (
  subject_code bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  course_id integer NULL,
  semester_id integer NULL,
  CONSTRAINT subject_pkey PRIMARY KEY (subject_code),
  CONSTRAINT subject_course_id_fk FOREIGN KEY (course_id) REFERENCES public.course(cid),
  CONSTRAINT subject_semester_id_fk FOREIGN KEY (semester_id) REFERENCES public.semester(sid)
);
CREATE UNIQUE INDEX IF NOT EXISTS subject_primary ON public.subject USING btree (subject_code);

CREATE TABLE public.timetable (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text NULL,
  file_url text NULL,
  for_date date NULL,
  created_date date NULL,
  CONSTRAINT timetable_pkey PRIMARY KEY (id)
);
CREATE UNIQUE INDEX IF NOT EXISTS timetable_primary ON public.timetable USING btree (id);
