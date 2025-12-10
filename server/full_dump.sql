--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4
-- Dumped by pg_dump version 15.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'ADMIN'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admins_id_seq OWNER TO postgres;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.levels (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    slug text
);


ALTER TABLE public.levels OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.levels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.levels_id_seq OWNER TO postgres;

--
-- Name: levels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.levels_id_seq OWNED BY public.levels.id;


--
-- Name: resource_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_tags (
    resource_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.resource_tags OWNER TO postgres;

--
-- Name: resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    unit_id integer,
    title text NOT NULL,
    type text NOT NULL,
    description text,
    file_url text,
    external_url text,
    mime text,
    language text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    size_bytes bigint,
    pages_count integer,
    notes text,
    mime_group text,
    CONSTRAINT resources_src_check CHECK ((COALESCE(NULLIF(file_url, ''::text), NULLIF(external_url, ''::text)) IS NOT NULL)),
    CONSTRAINT resources_type_check CHECK ((type = ANY (ARRAY['ORIGINAL'::text, 'SUMMARY'::text, 'TRANSCRIPT'::text, 'TABLE'::text, 'TREE'::text, 'COURSE_LINK'::text, 'AUDIO'::text, 'SLIDES'::text, 'IMAGE'::text, 'EXERCISES'::text, 'SOLUTION'::text, 'NOTES'::text, 'OTHER'::text])))
);


ALTER TABLE public.resources OWNER TO postgres;

--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.resources_id_seq OWNER TO postgres;

--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: science_subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.science_subject (
    science_id integer NOT NULL,
    subject_id integer NOT NULL
);


ALTER TABLE public.science_subject OWNER TO postgres;

--
-- Name: sciences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sciences (
    id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    slug text
);


ALTER TABLE public.sciences OWNER TO postgres;

--
-- Name: sciences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sciences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sciences_id_seq OWNER TO postgres;

--
-- Name: sciences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sciences_id_seq OWNED BY public.sciences.id;


--
-- Name: stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stages (
    id integer NOT NULL,
    level_id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    slug text
);


ALTER TABLE public.stages OWNER TO postgres;

--
-- Name: stages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.stages_id_seq OWNER TO postgres;

--
-- Name: stages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stages_id_seq OWNED BY public.stages.id;


--
-- Name: subject_sciences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_sciences (
    subject_id integer NOT NULL,
    science_id integer NOT NULL
);


ALTER TABLE public.subject_sciences OWNER TO postgres;

--
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id integer NOT NULL,
    name text NOT NULL,
    level_id integer,
    stage_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    slug text,
    description text
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- Name: subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subjects_id_seq OWNER TO postgres;

--
-- Name: subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subjects_id_seq OWNED BY public.subjects.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name text NOT NULL,
    slug text
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tags_id_seq OWNER TO postgres;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.units (
    id integer NOT NULL,
    subject_id integer NOT NULL,
    title text NOT NULL,
    order_index integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.units OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.units_id_seq OWNER TO postgres;

--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: levels id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels ALTER COLUMN id SET DEFAULT nextval('public.levels_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: sciences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sciences ALTER COLUMN id SET DEFAULT nextval('public.sciences_id_seq'::regclass);


--
-- Name: stages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages ALTER COLUMN id SET DEFAULT nextval('public.stages_id_seq'::regclass);


--
-- Name: subjects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects ALTER COLUMN id SET DEFAULT nextval('public.subjects_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, role, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.levels (id, name, created_at, updated_at, order_index, slug) FROM stdin;
1	التمهيدي	2025-12-10 19:52:09.816324+02	2025-12-10 19:52:09.816324+02	0	\N
\.


--
-- Data for Name: resource_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_tags (resource_id, tag_id) FROM stdin;
1	1
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resources (id, subject_id, unit_id, title, type, description, file_url, external_url, mime, language, tags, created_at, updated_at, size_bytes, pages_count, notes, mime_group) FROM stdin;
1	1	\N	جدول	TABLE	\N	https://res.cloudinary.com/dptlhu0s0/image/upload/v1765389479/rqeh880a3into8vy5evf.pdf	\N	application/pdf	\N	{}	2025-12-10 20:02:31.707399+02	2025-12-10 20:02:31.707399+02	\N	\N	\N	\N
\.


--
-- Data for Name: science_subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.science_subject (science_id, subject_id) FROM stdin;
\.


--
-- Data for Name: sciences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sciences (id, name, created_at, updated_at, order_index, slug) FROM stdin;
1	التزكية	2025-12-10 19:52:46.435168+02	2025-12-10 19:52:46.435168+02	1	\N
\.


--
-- Data for Name: stages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stages (id, level_id, name, created_at, updated_at, order_index, slug) FROM stdin;
1	1	التمهيدية	2025-12-10 19:52:34.253122+02	2025-12-10 19:52:34.253122+02	0	\N
\.


--
-- Data for Name: subject_sciences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject_sciences (subject_id, science_id) FROM stdin;
\.


--
-- Data for Name: subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subjects (id, name, level_id, stage_id, created_at, updated_at, order_index, slug, description) FROM stdin;
1	جدول	1	1	2025-12-10 19:54:39.83548+02	2025-12-10 19:54:39.83548+02	1	\N	\N
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, name, slug) FROM stdin;
1	جدول	\N
\.


--
-- Data for Name: units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.units (id, subject_id, title, order_index, created_at, updated_at) FROM stdin;
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_id_seq', 1, false);


--
-- Name: levels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.levels_id_seq', 1, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resources_id_seq', 1, true);


--
-- Name: sciences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sciences_id_seq', 1, true);


--
-- Name: stages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stages_id_seq', 1, true);


--
-- Name: subjects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subjects_id_seq', 1, true);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 1, true);


--
-- Name: units_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.units_id_seq', 1, false);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: levels levels_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_name_key UNIQUE (name);


--
-- Name: levels levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.levels
    ADD CONSTRAINT levels_pkey PRIMARY KEY (id);


--
-- Name: resource_tags resource_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_pkey PRIMARY KEY (resource_id, tag_id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: science_subject science_subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.science_subject
    ADD CONSTRAINT science_subject_pkey PRIMARY KEY (science_id, subject_id);


--
-- Name: sciences sciences_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sciences
    ADD CONSTRAINT sciences_name_key UNIQUE (name);


--
-- Name: sciences sciences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sciences
    ADD CONSTRAINT sciences_pkey PRIMARY KEY (id);


--
-- Name: stages stages_level_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_level_id_name_key UNIQUE (level_id, name);


--
-- Name: stages stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_pkey PRIMARY KEY (id);


--
-- Name: subject_sciences subject_sciences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_sciences
    ADD CONSTRAINT subject_sciences_pkey PRIMARY KEY (subject_id, science_id);


--
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: units units_subject_id_order_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_subject_id_order_index_key UNIQUE (subject_id, order_index);


--
-- Name: idx_resources_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_subject ON public.resources USING btree (subject_id);


--
-- Name: idx_resources_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_tags ON public.resources USING gin (tags);


--
-- Name: idx_resources_title_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_title_trgm ON public.resources USING gin (title public.gin_trgm_ops);


--
-- Name: idx_resources_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_type ON public.resources USING btree (type);


--
-- Name: idx_resources_unit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_resources_unit ON public.resources USING btree (unit_id);


--
-- Name: idx_stages_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stages_level ON public.stages USING btree (level_id);


--
-- Name: idx_subject_sciences_science; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subject_sciences_science ON public.subject_sciences USING btree (science_id);


--
-- Name: idx_subject_sciences_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subject_sciences_subject ON public.subject_sciences USING btree (subject_id);


--
-- Name: idx_subjects_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_level ON public.subjects USING btree (level_id);


--
-- Name: idx_subjects_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_name_trgm ON public.subjects USING gin (name public.gin_trgm_ops);


--
-- Name: idx_subjects_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_stage ON public.subjects USING btree (stage_id);


--
-- Name: idx_units_subject; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_subject ON public.units USING btree (subject_id);


--
-- Name: idx_units_subject_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_units_subject_order ON public.units USING btree (subject_id, order_index);


--
-- Name: admins trg_admins_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: levels trg_levels_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_levels_updated BEFORE UPDATE ON public.levels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: resources trg_resources_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: sciences trg_sciences_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_sciences_updated BEFORE UPDATE ON public.sciences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: stages trg_stages_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_stages_updated BEFORE UPDATE ON public.stages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: subjects trg_subjects_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: units trg_units_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: resource_tags resource_tags_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: resource_tags resource_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_tags
    ADD CONSTRAINT resource_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE;


--
-- Name: resources resources_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: resources resources_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.units(id) ON DELETE SET NULL;


--
-- Name: science_subject science_subject_science_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.science_subject
    ADD CONSTRAINT science_subject_science_id_fkey FOREIGN KEY (science_id) REFERENCES public.sciences(id) ON DELETE CASCADE;


--
-- Name: science_subject science_subject_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.science_subject
    ADD CONSTRAINT science_subject_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: stages stages_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stages
    ADD CONSTRAINT stages_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE CASCADE;


--
-- Name: subject_sciences subject_sciences_science_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_sciences
    ADD CONSTRAINT subject_sciences_science_id_fkey FOREIGN KEY (science_id) REFERENCES public.sciences(id) ON DELETE CASCADE;


--
-- Name: subject_sciences subject_sciences_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_sciences
    ADD CONSTRAINT subject_sciences_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: subjects subjects_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.levels(id) ON DELETE SET NULL;


--
-- Name: subjects subjects_stage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.stages(id) ON DELETE SET NULL;


--
-- Name: units units_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

