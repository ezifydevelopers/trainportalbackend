--
-- PostgreSQL database dump
--

\restrict lgvchqR92Mtuk2UKusoh1TVLDuolNfwFeaFxfkcmqfvGsxhhlGESUeNDB66oSmY

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: trainingportal_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO trainingportal_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: trainingportal_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ChatRoomType; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."ChatRoomType" AS ENUM (
    'DIRECT',
    'GROUP'
);


ALTER TYPE public."ChatRoomType" OWNER TO trainingportal_user;

--
-- Name: HelpRequestStatus; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."HelpRequestStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."HelpRequestStatus" OWNER TO trainingportal_user;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'FILE',
    'IMAGE',
    'SYSTEM'
);


ALTER TYPE public."MessageType" OWNER TO trainingportal_user;

--
-- Name: ResourceType; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."ResourceType" AS ENUM (
    'VIDEO',
    'PDF',
    'DOCUMENT',
    'IMAGE',
    'AUDIO'
);


ALTER TYPE public."ResourceType" OWNER TO trainingportal_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'TRAINEE',
    'MANAGER'
);


ALTER TYPE public."Role" OWNER TO trainingportal_user;

--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: trainingportal_user
--

CREATE TYPE public."UserStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."UserStatus" OWNER TO trainingportal_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Certificate; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Certificate" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "companyId" integer NOT NULL,
    "certificateNumber" text NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "pdfPath" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Certificate" OWNER TO dev;

--
-- Name: Certificate_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Certificate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Certificate_id_seq" OWNER TO dev;

--
-- Name: Certificate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Certificate_id_seq" OWNED BY public."Certificate".id;


--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."ChatMessage" (
    id integer NOT NULL,
    content text NOT NULL,
    "senderId" integer NOT NULL,
    "receiverId" integer,
    "chatRoomId" integer NOT NULL,
    "messageType" public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO dev;

--
-- Name: ChatMessage_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."ChatMessage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatMessage_id_seq" OWNER TO dev;

--
-- Name: ChatMessage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."ChatMessage_id_seq" OWNED BY public."ChatMessage".id;


--
-- Name: ChatRoom; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."ChatRoom" (
    id integer NOT NULL,
    name text,
    type public."ChatRoomType" DEFAULT 'DIRECT'::public."ChatRoomType" NOT NULL,
    "companyId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChatRoom" OWNER TO dev;

--
-- Name: ChatRoomParticipant; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."ChatRoomParticipant" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "chatRoomId" integer NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."ChatRoomParticipant" OWNER TO dev;

--
-- Name: ChatRoomParticipant_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."ChatRoomParticipant_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatRoomParticipant_id_seq" OWNER TO dev;

--
-- Name: ChatRoomParticipant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."ChatRoomParticipant_id_seq" OWNED BY public."ChatRoomParticipant".id;


--
-- Name: ChatRoom_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."ChatRoom_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ChatRoom_id_seq" OWNER TO dev;

--
-- Name: ChatRoom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."ChatRoom_id_seq" OWNED BY public."ChatRoom".id;


--
-- Name: Company; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Company" (
    id integer NOT NULL,
    name text NOT NULL,
    logo text
);


ALTER TABLE public."Company" OWNER TO dev;

--
-- Name: Company_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Company_id_seq" OWNER TO dev;

--
-- Name: Company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Company_id_seq" OWNED BY public."Company".id;


--
-- Name: Feedback; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Feedback" (
    id integer NOT NULL,
    "moduleId" integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public."Feedback" OWNER TO dev;

--
-- Name: Feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Feedback_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Feedback_id_seq" OWNER TO dev;

--
-- Name: Feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Feedback_id_seq" OWNED BY public."Feedback".id;


--
-- Name: HelpRequest; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."HelpRequest" (
    id integer NOT NULL,
    "traineeId" integer NOT NULL,
    "moduleId" integer,
    message text,
    status public."HelpRequestStatus" DEFAULT 'PENDING'::public."HelpRequestStatus" NOT NULL,
    "adminNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."HelpRequest" OWNER TO dev;

--
-- Name: HelpRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."HelpRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."HelpRequest_id_seq" OWNER TO dev;

--
-- Name: HelpRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."HelpRequest_id_seq" OWNED BY public."HelpRequest".id;


--
-- Name: MCQ; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."MCQ" (
    id integer NOT NULL,
    question text NOT NULL,
    options text[],
    answer text NOT NULL,
    explanation text,
    "moduleId" integer NOT NULL
);


ALTER TABLE public."MCQ" OWNER TO dev;

--
-- Name: MCQAnswer; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."MCQAnswer" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "moduleId" integer NOT NULL,
    "mcqId" integer NOT NULL,
    "selectedOption" text NOT NULL,
    "isCorrect" boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MCQAnswer" OWNER TO dev;

--
-- Name: MCQAnswer_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."MCQAnswer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MCQAnswer_id_seq" OWNER TO dev;

--
-- Name: MCQAnswer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."MCQAnswer_id_seq" OWNED BY public."MCQAnswer".id;


--
-- Name: MCQ_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."MCQ_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MCQ_id_seq" OWNER TO dev;

--
-- Name: MCQ_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."MCQ_id_seq" OWNED BY public."MCQ".id;


--
-- Name: ManagerCompanyAssignment; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."ManagerCompanyAssignment" (
    id integer NOT NULL,
    "managerId" integer NOT NULL,
    "companyId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ManagerCompanyAssignment" OWNER TO dev;

--
-- Name: ManagerCompanyAssignment_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."ManagerCompanyAssignment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ManagerCompanyAssignment_id_seq" OWNER TO dev;

--
-- Name: ManagerCompanyAssignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."ManagerCompanyAssignment_id_seq" OWNED BY public."ManagerCompanyAssignment".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Notification" OWNER TO dev;

--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notification_id_seq" OWNER TO dev;

--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: Resource; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Resource" (
    id integer NOT NULL,
    url text NOT NULL,
    filename text NOT NULL,
    type public."ResourceType" NOT NULL,
    duration integer,
    "moduleId" integer NOT NULL,
    "originalName" text NOT NULL,
    "filePath" text NOT NULL,
    "estimatedReadingTime" integer,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Resource" OWNER TO dev;

--
-- Name: ResourceTimeTracking; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."ResourceTimeTracking" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "resourceId" integer NOT NULL,
    "timeSpent" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ResourceTimeTracking" OWNER TO dev;

--
-- Name: ResourceTimeTracking_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."ResourceTimeTracking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ResourceTimeTracking_id_seq" OWNER TO dev;

--
-- Name: ResourceTimeTracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."ResourceTimeTracking_id_seq" OWNED BY public."ResourceTimeTracking".id;


--
-- Name: Resource_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Resource_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Resource_id_seq" OWNER TO dev;

--
-- Name: Resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Resource_id_seq" OWNED BY public."Resource".id;


--
-- Name: TraineeProgress; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."TraineeProgress" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "moduleId" integer NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    score integer,
    "timeSpent" integer,
    pass boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'IN_PROGRESS'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."TraineeProgress" OWNER TO dev;

--
-- Name: TraineeProgress_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."TraineeProgress_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TraineeProgress_id_seq" OWNER TO dev;

--
-- Name: TraineeProgress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."TraineeProgress_id_seq" OWNED BY public."TraineeProgress".id;


--
-- Name: TrainingModule; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."TrainingModule" (
    id integer NOT NULL,
    name text NOT NULL,
    "companyId" integer NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isResourceModule" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."TrainingModule" OWNER TO dev;

--
-- Name: TrainingModule_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."TrainingModule_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."TrainingModule_id_seq" OWNER TO dev;

--
-- Name: TrainingModule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."TrainingModule_id_seq" OWNED BY public."TrainingModule".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    "companyId" integer,
    "isVerified" boolean DEFAULT false NOT NULL,
    status public."UserStatus" DEFAULT 'PENDING'::public."UserStatus" NOT NULL
);


ALTER TABLE public."User" OWNER TO dev;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO dev;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Video; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public."Video" (
    id integer NOT NULL,
    url text NOT NULL,
    duration integer NOT NULL,
    "moduleId" integer NOT NULL
);


ALTER TABLE public."Video" OWNER TO dev;

--
-- Name: Video_id_seq; Type: SEQUENCE; Schema: public; Owner: dev
--

CREATE SEQUENCE public."Video_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Video_id_seq" OWNER TO dev;

--
-- Name: Video_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: dev
--

ALTER SEQUENCE public."Video_id_seq" OWNED BY public."Video".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: dev
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO dev;

--
-- Name: Certificate id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Certificate" ALTER COLUMN id SET DEFAULT nextval('public."Certificate_id_seq"'::regclass);


--
-- Name: ChatMessage id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatMessage" ALTER COLUMN id SET DEFAULT nextval('public."ChatMessage_id_seq"'::regclass);


--
-- Name: ChatRoom id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoom" ALTER COLUMN id SET DEFAULT nextval('public."ChatRoom_id_seq"'::regclass);


--
-- Name: ChatRoomParticipant id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoomParticipant" ALTER COLUMN id SET DEFAULT nextval('public."ChatRoomParticipant_id_seq"'::regclass);


--
-- Name: Company id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Company" ALTER COLUMN id SET DEFAULT nextval('public."Company_id_seq"'::regclass);


--
-- Name: Feedback id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Feedback" ALTER COLUMN id SET DEFAULT nextval('public."Feedback_id_seq"'::regclass);


--
-- Name: HelpRequest id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."HelpRequest" ALTER COLUMN id SET DEFAULT nextval('public."HelpRequest_id_seq"'::regclass);


--
-- Name: MCQ id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQ" ALTER COLUMN id SET DEFAULT nextval('public."MCQ_id_seq"'::regclass);


--
-- Name: MCQAnswer id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQAnswer" ALTER COLUMN id SET DEFAULT nextval('public."MCQAnswer_id_seq"'::regclass);


--
-- Name: ManagerCompanyAssignment id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ManagerCompanyAssignment" ALTER COLUMN id SET DEFAULT nextval('public."ManagerCompanyAssignment_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: Resource id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Resource" ALTER COLUMN id SET DEFAULT nextval('public."Resource_id_seq"'::regclass);


--
-- Name: ResourceTimeTracking id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ResourceTimeTracking" ALTER COLUMN id SET DEFAULT nextval('public."ResourceTimeTracking_id_seq"'::regclass);


--
-- Name: TraineeProgress id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TraineeProgress" ALTER COLUMN id SET DEFAULT nextval('public."TraineeProgress_id_seq"'::regclass);


--
-- Name: TrainingModule id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TrainingModule" ALTER COLUMN id SET DEFAULT nextval('public."TrainingModule_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Video id; Type: DEFAULT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Video" ALTER COLUMN id SET DEFAULT nextval('public."Video_id_seq"'::regclass);


--
-- Data for Name: Certificate; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Certificate" (id, "userId", "companyId", "certificateNumber", "issuedAt", "completedAt", "pdfPath", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."ChatMessage" (id, content, "senderId", "receiverId", "chatRoomId", "messageType", "isRead", "createdAt", "updatedAt") FROM stdin;
32	fgdfgdfg	1	\N	5	TEXT	f	2025-09-16 21:12:53.114	2025-09-16 21:12:53.114
33	s fgdsdf gsdf	1	\N	5	TEXT	f	2025-09-16 21:12:55.205	2025-09-16 21:12:55.205
34	sdfg sdfg sdf	1	\N	5	TEXT	f	2025-09-16 21:12:56.6	2025-09-16 21:12:56.6
35	g g jhdfgh fgdh fdg fgdh	4	\N	7	TEXT	f	2025-09-18 18:23:58.601	2025-09-18 18:23:58.601
36	Hello	4	\N	6	TEXT	f	2025-09-18 18:24:13.793	2025-09-18 18:24:13.793
37	Hello Deep	17	\N	8	TEXT	f	2025-09-24 13:19:34.456	2025-09-24 13:19:34.456
38	Hello	1	\N	7	TEXT	f	2025-09-24 21:26:58.601	2025-09-24 21:26:58.601
50	g	1	\N	8	TEXT	f	2025-09-25 15:03:48.055	2025-09-25 15:03:48.055
51	j	1	\N	8	TEXT	f	2025-09-25 15:03:52.855	2025-09-25 15:03:52.855
52	sdsd	1	\N	7	TEXT	f	2025-09-25 20:23:43.692	2025-09-25 20:23:43.692
53	aaaaaaaaaaaaaaaaaaaaaaaaa	1	\N	7	TEXT	f	2025-09-25 20:23:56.648	2025-09-25 20:23:56.648
54	Well it's fine	1	\N	7	TEXT	f	2025-09-26 14:14:40.233	2025-09-26 14:14:40.233
55	How are you?	13	\N	6	TEXT	f	2025-09-26 14:21:53.635	2025-09-26 14:21:53.635
\.


--
-- Data for Name: ChatRoom; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."ChatRoom" (id, name, type, "companyId", "createdAt", "updatedAt") FROM stdin;
5	\N	DIRECT	26	2025-09-16 21:12:49.954	2025-09-16 21:12:56.602
4	\N	DIRECT	26	2025-08-26 14:18:01.576	2025-09-17 19:48:11.315
50	\N	DIRECT	30	2025-09-18 13:43:37.673	2025-09-18 18:35:19.315
46	\N	DIRECT	23	2025-09-11 19:02:33.924	2025-09-11 19:02:40.552
47	\N	DIRECT	26	2025-09-11 19:02:43.348	2025-09-11 19:02:46.64
48	\N	DIRECT	26	2025-09-11 19:02:49.084	2025-09-11 19:02:52.103
49	\N	DIRECT	26	2025-09-12 13:47:47.417	2025-09-12 14:22:39.698
8	\N	DIRECT	26	2025-09-24 13:19:27.776	2025-09-25 15:03:52.857
7	\N	DIRECT	26	2025-09-18 18:23:44.237	2025-09-26 14:14:40.237
6	\N	DIRECT	26	2025-09-18 18:23:34.357	2025-09-26 14:21:53.638
\.


--
-- Data for Name: ChatRoomParticipant; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."ChatRoomParticipant" (id, "userId", "chatRoomId", "joinedAt", "isActive") FROM stdin;
9	1	5	2025-09-16 21:12:49.954	t
10	13	5	2025-09-16 21:12:49.954	t
11	4	6	2025-09-18 18:23:34.357	t
12	13	6	2025-09-18 18:23:34.357	t
13	4	7	2025-09-18 18:23:44.237	t
14	1	7	2025-09-18 18:23:44.237	t
15	17	8	2025-09-24 13:19:27.776	t
16	1	8	2025-09-24 13:19:27.776	t
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Company" (id, name, logo) FROM stdin;
28	G Force Security	1758048144363-870163030.png
27	Next Employment	1758048150873-741270075.png
25	Univerca	1758048157758-325737962.png
24	Zone Placements	1758048163327-222287294.png
23	Star Employment	1758048172872-867961318.png
26	Jobs For You	1758749408512-703560182.png
30	YTC Healthcare 	1758749876011-245804300.png
29	247 Gard Security	1758750728891-437200658.png
32	Bilal	1758896462568-154257562.png
33	Jimmy	1758897155797-760345289.png
\.


--
-- Data for Name: Feedback; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Feedback" (id, "moduleId", rating, comment, "createdAt", "userId") FROM stdin;
\.


--
-- Data for Name: HelpRequest; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."HelpRequest" (id, "traineeId", "moduleId", message, status, "adminNotes", "createdAt", "updatedAt") FROM stdin;
4	4	48	Having one issue	RESOLVED	\N	2025-09-18 18:23:26.175	2025-09-23 18:46:44.588
1	4	\N	Hello Admin, having problem.	RESOLVED	Issue resolved	2025-08-26 15:29:01.44	2025-08-26 15:29:52.661
3	4	29	Hi Admin I have problem  Abc	RESOLVED	Hi Deep it's resolved	2025-08-29 14:22:11.199	2025-08-29 14:23:31.835
2	4	23	Have a question	RESOLVED	\N	2025-08-27 13:29:38.569	2025-09-11 21:09:00.826
\.


--
-- Data for Name: MCQ; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."MCQ" (id, question, options, answer, explanation, "moduleId") FROM stdin;
67	What is the primary function of a staffing/recruitment agency?	{"To train employees in specific job skills","To provide legal advice to companies","To match job seekers with potential employers","To manage the payroll for all companies"}	To match job seekers with potential employers	\N	48
68	A recruitment agency acts as a bridge between:	{"Investors and companies","Job seekers and employers","Lawyers and clients","Banks and customers"}	Job seekers and employers	\N	48
69	Where did the company initially provide staffing services?	{Alberta,"All across Canada",Ontario,"British Columbia"}	All across Canada	\N	49
73	Which type of staffing is best for short-term or seasonal needs?	{Temp-to-Perm,"Direct Hire","Freelance Hiring","Temporary Staffing"}	Temporary Staffing	\N	22
74	Direct Hire Staffing involves:	{"Permanent placement of candidates","Seasonal recruitment","Hiring for freelance work","No interviews at all"}	Permanent placement of candidates	\N	22
75	In Temp-to-Perm staffing, employees:	{"Are hired permanently from day one","Work only during holidays","Start temporarily and may be hired permanently","Are not evaluated before hiring"}	Start temporarily and may be hired permanently	\N	22
76	Which staffing solution is ideal for urgent or fluctuating staffing needs?	{"Temp-to-Perm Staffing","Executive Search","Temporary Staffing","Direct Hire Staffing"}	Temporary Staffing	\N	22
77	What is the main goal of Direct Hire Staffing?	{"Fill short-term roles","Place permanent employees directly into long-term roles","Find seasonal workers","Offer unpaid internships"}	Fill short-term roles	\N	22
78	What is a “mark-up rate” in the context of Temp staffing services?\n	{"The percentage added to a worker’s wage to cover administrative and overhead costs for the staffing agency.","The rate at which the staffing agency sets the hourly wage for temporary workers.","A discount applied to the staffing service fee.","The fee charged to the client for direct hire placements."}	The percentage added to a worker’s wage to cover administrative and overhead costs for the staffing agency.	\N	24
79	How is the mark-up rate typically calculated for Temp staffing?\n	{"It is a flat fee per worker, regardless of hours worked.","It is based on the worker’s educational qualifications.","It is based on the total number of hours the employee works.","It is a percentage of the employee's hourly wage."}	It is a percentage of the employee's hourly wage.	\N	24
80	In a Direct Hire arrangement, who typically pays the recruitment fee to the staffing agency?\n	{"The employee","The client company (employer)","The staffing agency","The government"}	The employee	\N	24
81	If a Direct Hire placement does not work out, what is a common policy regarding the recruitment fee?\n	{"The client is guaranteed a refund.","The staffing agency offers a replacement candidate at no extra charge, typically within a certain period.","The recruitment fee is waived.","The client is required to pay an additional fee for a replacement."}	The staffing agency offers a replacement candidate at no extra charge, typically within a certain period.	\N	24
82	What does MailSuite help you do?	{"Send pre-recorded voice messages","Send personalized email blasts from Google Sheets","Schedule Zoom meetings","Track website analytics"}	Send personalized email blasts from Google Sheets	\N	26
83	Before sending an email blast, which of the following is most important to check?	{"Time zone of recipients","If the sheet is saved as a PDF","The formatting of your chart colors","Your email subject line and merge tags"}	Your email subject line and merge tags	\N	26
86	What is one of the main productivity benefits of using MailSuite?	{"It helps track and schedule emails efficiently","It allows sending emails without an internet connection","It automatically writes your emails","It blocks all incoming messages"}	It helps track and schedule emails efficiently	\N	27
87	What is a common use of email tracking in MailSuite?	{"To delete emails after they are read","To prevent emails from being forwarded","To know when and if a recipient has opened the email","To read encrypted messages"}	To delete emails after they are read	\N	27
88	What feature in MailSuite can help users save time when writing repetitive emails?	{Auto-delete,"Email templates","Random signature generator","Spam generator"}	Email templates	\N	27
89	Why are customized emails important in sales?	{"They help build stronger relationships by addressing specific customer needs","They allow sending generic promotions to all contacts","They reduce email length significantly","They automatically close deals without follow-up"}	They help build stronger relationships by addressing specific customer needs	\N	28
90	Which of the following is an example of a customized sales email?	{"“Dear Customer, check out our new product.”","“Hi [Name], I noticed your company [Company Name] recently expanded. Here’s how our solution can support your growth.”","“We have a sale this weekend.”","“Buy now to get 50% off!”"}	“Dear Customer, check out our new product.”	\N	28
91	Which data points are useful to customize sales emails effectively?	{"Random personal information unrelated to work","The sender’s favorite hobbies","Email length only","Prospect’s name, company, industry, and recent activities"}	Random personal information unrelated to work	\N	28
98	Which of the following is a primary benefit of calling clients?	{"Reduces the number of meetings","Builds stronger relationships","Eliminates all client concerns","Replaces face-to-face interactions"}	Builds stronger relationships	\N	29
99	Calling clients allows for immediate feedback and quick clarification. This highlights which advantage?	{"Faster Communication","Enhances Sales","Builds Trust","Increases Engagement"}	Faster Communication	\N	29
100	Which benefit of calling clients helps clear up disputes quickly?	{"Addressing complex issues","Building trust","Increasing engagement","Resolving misunderstandings"}	Resolving misunderstandings	\N	29
101	Which of the following best demonstrates showing interest in a client’s needs?	{"Rushing through the call to save time","Listening actively and asking thoughtful questions","Talking more than the client","Giving one-word responses"}	Listening actively and asking thoughtful questions	\N	29
102	Maintaining a calm and patient demeanor during client conversations helps to:	{"Reduce misunderstandings and show thoughtfulness","End calls faster","Avoid discussing problems","Sound more authoritative"}	Reduce misunderstandings and show thoughtfulness	\N	29
103	What is the main goal of sending follow-up emails?	{"To reduce the number of client interactions","To keep in touch with clients and stay top of mind","To avoid repeated communication","To replace client meetings entirely"}	To keep in touch with clients and stay top of mind	\N	30
104	Sending follow-up emails demonstrates:	{"Professionalism, reliability, and commitment","A lack of trust in the client","That you prefer email over calls","That clients need reminders constantly"}	Professionalism, reliability, and commitment	\N	30
105	According to the slide, follow-up emails are essential for:	{"Avoiding unnecessary calls","Staying top-of-mind, building trust, and increasing deal success","Replacing professional meetings","Reducing workload permanently"}	Staying top-of-mind, building trust, and increasing deal success	\N	30
106	Which of the following is NOT a filter you can use in Apollo.io?	{Industry,Location,"Job Title","Favorite Food"}	Favorite Food	\N	31
107	After applying filters or searching for a specific person in Apollo.io, what will you see?	{"A list of potential leads","A list of email templates","Automatic outreach emails","A calendar invite"}	A list of potential leads	\N	31
108	Why should you research a company’s needs on Indeed?	{"To find salary details","To see if the company provides free services","To understand what staffing services might appeal to them","To get company’s financial reports"}	To understand what staffing services might appeal to them	\N	32
109	Which of the following is not a filter you can use when searching on Indeed?	{"Job Title",Company,"Education Level","Job Type"}	Education Level	\N	32
110	What should you use first to find job postings on LinkedIn?	{InMail,"Search bar","Recruiter tool",Groups}	Search bar	\N	33
111	Which of the following can you type in LinkedIn search to find jobs?	{Salaries,"Job Titles, Company, Industry","Employee reviews","Past projects"}	Job Titles, Company, Industry	\N	33
112	What is the main purpose of using Indeed and LinkedIn in lead generation?	{"To find companies with open positions and pitch staffing services","To apply for jobs directly","To compare salaries across industries","To create advertisements for job seekers"}	To find companies with open positions and pitch staffing services	\N	34
113	What is the primary purpose of Botsol Crawler?	{"Sending bulk emails","Creating resumes automatically","Extracting business leads and contact details from websites","Posting job ads"}	Extracting business leads and contact details from websites	\N	35
114	Which of the following information can Botsol Crawler typically collect?	{"Phone numbers","Email addresses","Company names and URLs","All of the above"}	All of the above	\N	35
115	What is the main purpose of using Sales Navigator for BDAs?	{"To create job postings","To send targeted InMails or messages to potential leads","To write resumes for candidates","To download job applications"}	To send targeted InMails or messages to potential leads	\N	36
116	Example of a strong opening in an InMail is:	{"“I saw your recent post about company expansion, and I’d love to discuss how we can support your hiring needs.”","“Hello, please hire my agency.”","“We are the best agency in the world. Contact us.”","“Looking for jobs? Let us know.”"}	“I saw your recent post about company expansion, and I’d love to discuss how we can support your hiring needs.”	\N	36
117	What is the first step when working on target companies for staffing services outreach?	{"Customize your outreach","Research their job postings","Understand the list of target companies","Send a LinkedIn message"}	Understand the list of target companies	\N	51
118	What should you look for when identifying key decision-makers?	{"Finance Managers","Sales Executives","HR Managers, Recruiters, or Hiring Managers",Interns}	HR Managers, Recruiters, or Hiring Managers	\N	51
119	What should you do if you don’t receive a response within a week?	{"Send a polite follow-up message","Block the contact","Wait another month","Report the contact"}	Send a polite follow-up message	\N	51
120	What is the final goal of the staffing services outreach process?	{"To gain more social media followers","To offer discounts","To attend their internal meetings","To connect with companies, understand their needs, and offer tailored staffing solutions"}	To connect with companies, understand their needs, and offer tailored staffing solutions	\N	51
121	What is subcontracting in the context of staffing services?	{"Hiring freelancers for internal tasks","One staffing agency partnering with another to fulfill a client’s staffing needs","A client outsourcing recruitment to an external company","Hiring temporary employees directly from job boards"}	One staffing agency partnering with another to fulfill a client’s staffing needs	\N	38
122	What is a key benefit of subcontracting for the primary staffing agency?	{"Reduces the need for employee benefits","Increases their branding reach","Helps extend its reach, resources, or expertise without hiring more staff","Eliminates the need for background checks"}	Helps extend its reach, resources, or expertise without hiring more staff	\N	38
123	Why is it important to understand client needs?	{"To reduce pricing","To present a solution that addresses their pain points","To avoid negotiating terms","To finalize contracts immediately"}	To present a solution that addresses their pain points	\N	39
124	Which step focuses on addressing client concerns with confidence?	{Follow-Up,"Handle Objections","Create a Sense of Urgency","Present a Tailored Solution"}	Handle Objections	\N	39
125	What is the overall goal for a Business Development Associate (BDA)?	{"To collect resumes only","To finalize contracts without negotiation","To handle recruitment independently","To build trust, offer solutions, and close deals to grow the business"}	To build trust, offer solutions, and close deals to grow the business	\N	39
127	The Canadian construction industry has peak demand for labourers during which season?	{Winter,Summer,Fall,Spring}	Summer	\N	58
128	Which Canadian industry regularly hires cleaners, janitors, and maintenance staff?	{Hospitality,IT,Banking,"Space Exploration"}	Hospitality	\N	58
129	Hospitality jobs such as hotel staff and restaurant servers are especially in demand during which season in Canada’s tourist-heavy areas?	{"Fall only","Spring only","Year-round, no peaks","Winter & Summer (holiday and vacation peaks)"}	Winter & Summer (holiday and vacation peaks)	\N	58
130	Employment Insurance (EI) in Ontario is:	{"A health insurance program","A government-managed unemployment insurance program","A private retirement fund","A company savings plan"}	A government-managed unemployment insurance program	\N	23
131	Anti-discrimination laws in Ontario protect employees based on:	{"Age only","Gender, race, religion, disability, etc.","Salary levels","Company size"}	Gender, race, religion, disability, etc.	\N	23
132	What is subcontracting in the context of staffing services?	{"Hiring freelancers for internal tasks","One staffing agency partnering with another to fulfill a client’s staffing needs","A client outsourcing recruitment to an external company","Hiring temporary employees directly from job boards"}	One staffing agency partnering with another to fulfill a client’s staffing needs	\N	60
133	What is a key benefit of subcontracting for the primary staffing agency?	{"Reduces the need for employee benefits","Increases their branding reach","Helps extend its reach, resources, or expertise without hiring more staff","Eliminates the need for background checks"}	Helps extend its reach, resources, or expertise without hiring more staff	\N	60
134	What is the first step when working on target companies for staffing services outreach?	{"Customize your outreach","Research their job postings","Understand the list of target companies","Send a LinkedIn message"}	Understand the list of target companies	\N	61
135	What should you look for when identifying key decision-makers?	{"Finance Managers","Sales Executives","HR Managers, Recruiters, or Hiring Managers",Interns}	HR Managers, Recruiters, or Hiring Managers	\N	61
136	What should you do if you don’t receive a response within a week?	{"Send a polite follow-up message","Block the contact","Wait another month","Report the contact"}	Send a polite follow-up message	\N	61
137	What is the final goal of the staffing services outreach process?	{"To gain more social media followers","To offer discounts","To attend their internal meetings","To connect with companies, understand their needs, and offer tailored staffing solutions"}	To connect with companies, understand their needs, and offer tailored staffing solutions	\N	61
138	Why is it important to understand client needs?	{"To reduce pricing","To present a solution that addresses their pain points","To avoid negotiating terms","To finalize contracts immediately"}	To present a solution that addresses their pain points	\N	62
139	Which step focuses on addressing client concerns with confidence?	{Follow-Up,"Handle Objections","Create a Sense of Urgency","Present a Tailored Solution"}	Handle Objections	\N	62
140	What is the overall goal for a Business Development Associate (BDA)?	{"To collect resumes only","To finalize contracts without negotiation","To handle recruitment independently","To build trust, offer solutions, and close deals to grow the business"}	To build trust, offer solutions, and close deals to grow the business	\N	62
141	What is the primary function of a staffing/recruitment agency?	{"To train employees in specific job skills","To provide legal advice to companies","To match job seekers with potential employers","To manage the payroll for all companies"}	To match job seekers with potential employers	\N	64
142	A recruitment agency acts as a bridge between:	{"Investors and companies","Job seekers and employers","Lawyers and clients","Banks and customers"}	Job seekers and employers	\N	64
143	Where did the company initially provide staffing services?	{Alberta,"All across Canada",Ontario,"British Columbia"}	All across Canada	\N	68
144	Which type of staffing is best for short-term or seasonal needs?	{Temp-to-Perm,"Direct Hire","Freelance Hiring","Temporary Staffing"}	Temporary Staffing	\N	69
145	Direct Hire Staffing involves:	{"Permanent placement of candidates","Seasonal recruitment","Hiring for freelance work","No interviews at all"}	Permanent placement of candidates	\N	69
146	In Temp-to-Perm staffing, employees:	{"Are hired permanently from day one","Work only during holidays","Start temporarily and may be hired permanently","Are not evaluated before hiring"}	Start temporarily and may be hired permanently	\N	69
147	Which staffing solution is ideal for urgent or fluctuating staffing needs?	{"Temp-to-Perm Staffing","Executive Search","Temporary Staffing","Direct Hire Staffing"}	Temporary Staffing	\N	69
148	What is the main goal of Direct Hire Staffing?	{"Fill short-term roles","Place permanent employees directly into long-term roles","Find seasonal workers","Offer unpaid internships"}	Fill short-term roles	\N	69
149	The Canadian construction industry has peak demand for labourers during which season?	{Winter,Summer,Fall,Spring}	Summer	\N	70
150	Which Canadian industry regularly hires cleaners, janitors, and maintenance staff?	{Hospitality,IT,Banking,"Space Exploration"}	Hospitality	\N	70
151	Hospitality jobs such as hotel staff and restaurant servers are especially in demand during which season in Canada’s tourist-heavy areas?	{"Fall only","Spring only","Year-round, no peaks","Winter & Summer (holiday and vacation peaks)"}	Winter & Summer (holiday and vacation peaks)	\N	70
152	Employment Insurance (EI) in Ontario is:	{"A health insurance program","A government-managed unemployment insurance program","A private retirement fund","A company savings plan"}	A government-managed unemployment insurance program	\N	71
153	Anti-discrimination laws in Ontario protect employees based on:	{"Age only","Gender, race, religion, disability, etc.","Salary levels","Company size"}	Gender, race, religion, disability, etc.	\N	71
154	What is a “mark-up rate” in the context of Temp staffing services?\n	{"The percentage added to a worker’s wage to cover administrative and overhead costs for the staffing agency.","The rate at which the staffing agency sets the hourly wage for temporary workers.","A discount applied to the staffing service fee.","The fee charged to the client for direct hire placements."}	The percentage added to a worker’s wage to cover administrative and overhead costs for the staffing agency.	\N	72
155	How is the mark-up rate typically calculated for Temp staffing?\n	{"It is a flat fee per worker, regardless of hours worked.","It is based on the worker’s educational qualifications.","It is based on the total number of hours the employee works.","It is a percentage of the employee's hourly wage."}	It is a percentage of the employee's hourly wage.	\N	72
156	In a Direct Hire arrangement, who typically pays the recruitment fee to the staffing agency?\n	{"The employee","The client company (employer)","The staffing agency","The government"}	The employee	\N	72
157	If a Direct Hire placement does not work out, what is a common policy regarding the recruitment fee?\n	{"The client is guaranteed a refund.","The staffing agency offers a replacement candidate at no extra charge, typically within a certain period.","The recruitment fee is waived.","The client is required to pay an additional fee for a replacement."}	The staffing agency offers a replacement candidate at no extra charge, typically within a certain period.	\N	72
158	What does MailSuite help you do?	{"Send pre-recorded voice messages","Send personalized email blasts from Google Sheets","Schedule Zoom meetings","Track website analytics"}	Send personalized email blasts from Google Sheets	\N	74
159	Before sending an email blast, which of the following is most important to check?	{"Time zone of recipients","If the sheet is saved as a PDF","The formatting of your chart colors","Your email subject line and merge tags"}	Your email subject line and merge tags	\N	74
160	What is one of the main productivity benefits of using MailSuite?	{"It helps track and schedule emails efficiently","It allows sending emails without an internet connection","It automatically writes your emails","It blocks all incoming messages"}	It helps track and schedule emails efficiently	\N	75
161	What is a common use of email tracking in MailSuite?	{"To delete emails after they are read","To prevent emails from being forwarded","To know when and if a recipient has opened the email","To read encrypted messages"}	To delete emails after they are read	\N	75
162	What feature in MailSuite can help users save time when writing repetitive emails?	{Auto-delete,"Email templates","Random signature generator","Spam generator"}	Email templates	\N	75
163	Why are customized emails important in sales?	{"They help build stronger relationships by addressing specific customer needs","They allow sending generic promotions to all contacts","They reduce email length significantly","They automatically close deals without follow-up"}	They help build stronger relationships by addressing specific customer needs	\N	76
164	Which of the following is an example of a customized sales email?	{"“Dear Customer, check out our new product.”","“Hi [Name], I noticed your company [Company Name] recently expanded. Here’s how our solution can support your growth.”","“We have a sale this weekend.”","“Buy now to get 50% off!”"}	“Dear Customer, check out our new product.”	\N	76
165	Which data points are useful to customize sales emails effectively?	{"Random personal information unrelated to work","The sender’s favorite hobbies","Email length only","Prospect’s name, company, industry, and recent activities"}	Random personal information unrelated to work	\N	76
166	Which of the following is a primary benefit of calling clients?	{"Reduces the number of meetings","Builds stronger relationships","Eliminates all client concerns","Replaces face-to-face interactions"}	Builds stronger relationships	\N	77
167	Calling clients allows for immediate feedback and quick clarification. This highlights which advantage?	{"Faster Communication","Enhances Sales","Builds Trust","Increases Engagement"}	Faster Communication	\N	77
168	Which benefit of calling clients helps clear up disputes quickly?	{"Addressing complex issues","Building trust","Increasing engagement","Resolving misunderstandings"}	Resolving misunderstandings	\N	77
169	Which of the following best demonstrates showing interest in a client’s needs?	{"Rushing through the call to save time","Listening actively and asking thoughtful questions","Talking more than the client","Giving one-word responses"}	Listening actively and asking thoughtful questions	\N	77
170	Maintaining a calm and patient demeanor during client conversations helps to:	{"Reduce misunderstandings and show thoughtfulness","End calls faster","Avoid discussing problems","Sound more authoritative"}	Reduce misunderstandings and show thoughtfulness	\N	77
171	What is the main goal of sending follow-up emails?	{"To reduce the number of client interactions","To keep in touch with clients and stay top of mind","To avoid repeated communication","To replace client meetings entirely"}	To keep in touch with clients and stay top of mind	\N	78
172	Sending follow-up emails demonstrates:	{"Professionalism, reliability, and commitment","A lack of trust in the client","That you prefer email over calls","That clients need reminders constantly"}	Professionalism, reliability, and commitment	\N	78
173	According to the slide, follow-up emails are essential for:	{"Avoiding unnecessary calls","Staying top-of-mind, building trust, and increasing deal success","Replacing professional meetings","Reducing workload permanently"}	Staying top-of-mind, building trust, and increasing deal success	\N	78
174	Which of the following is NOT a filter you can use in Apollo.io?	{Industry,Location,"Job Title","Favorite Food"}	Favorite Food	\N	79
175	After applying filters or searching for a specific person in Apollo.io, what will you see?	{"A list of potential leads","A list of email templates","Automatic outreach emails","A calendar invite"}	A list of potential leads	\N	79
176	Why should you research a company’s needs on Indeed?	{"To find salary details","To see if the company provides free services","To understand what staffing services might appeal to them","To get company’s financial reports"}	To understand what staffing services might appeal to them	\N	80
177	Which of the following is not a filter you can use when searching on Indeed?	{"Job Title",Company,"Education Level","Job Type"}	Education Level	\N	80
178	What should you use first to find job postings on LinkedIn?	{InMail,"Search bar","Recruiter tool",Groups}	Search bar	\N	81
179	Which of the following can you type in LinkedIn search to find jobs?	{Salaries,"Job Titles, Company, Industry","Employee reviews","Past projects"}	Job Titles, Company, Industry	\N	81
180	What is the main purpose of using Indeed and LinkedIn in lead generation?	{"To find companies with open positions and pitch staffing services","To apply for jobs directly","To compare salaries across industries","To create advertisements for job seekers"}	To find companies with open positions and pitch staffing services	\N	82
181	What is the primary purpose of Botsol Crawler?	{"Sending bulk emails","Creating resumes automatically","Extracting business leads and contact details from websites","Posting job ads"}	Extracting business leads and contact details from websites	\N	83
182	Which of the following information can Botsol Crawler typically collect?	{"Phone numbers","Email addresses","Company names and URLs","All of the above"}	All of the above	\N	83
183	What is the main purpose of using Sales Navigator for BDAs?	{"To create job postings","To send targeted InMails or messages to potential leads","To write resumes for candidates","To download job applications"}	To send targeted InMails or messages to potential leads	\N	84
184	Example of a strong opening in an InMail is:	{"“I saw your recent post about company expansion, and I’d love to discuss how we can support your hiring needs.”","“Hello, please hire my agency.”","“We are the best agency in the world. Contact us.”","“Looking for jobs? Let us know.”"}	“I saw your recent post about company expansion, and I’d love to discuss how we can support your hiring needs.”	\N	84
\.


--
-- Data for Name: MCQAnswer; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."MCQAnswer" (id, "userId", "moduleId", "mcqId", "selectedOption", "isCorrect", "createdAt") FROM stdin;
\.


--
-- Data for Name: ManagerCompanyAssignment; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."ManagerCompanyAssignment" (id, "managerId", "companyId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Notification" (id, "userId", type, title, message, "isRead", metadata, "createdAt", "updatedAt") FROM stdin;
2	10	NEW_TRAINEE_SIGNUP	New Trainee Signup	Zone tester (zone1@example.com) has signed up and is pending approval.	f	{"traineeId": 17, "traineeName": "Zone tester", "traineeEmail": "zone1@example.com"}	2025-09-18 16:07:07.973	2025-09-18 16:07:07.973
4	1	NEW_TRAINEE_SIGNUP	New Trainee Signup	Zone tester (zone1@example.com) has signed up and is pending approval.	f	{"traineeId": 17, "traineeName": "Zone tester", "traineeEmail": "zone1@example.com"}	2025-09-18 16:07:07.973	2025-09-18 16:07:07.973
5	17	TRAINEE_APPROVED	Account Approved	Your account has been approved and assigned to Zone Placements. You can now log in and start your training.	f	{"status": "APPROVED", "companyName": "Zone Placements", "approvalDate": "2025-09-18T16:07:23.232Z"}	2025-09-18 16:07:23.233	2025-09-18 16:07:23.233
3	14	NEW_TRAINEE_SIGNUP	New Trainee Signup	Zone tester (zone1@example.com) has signed up and is pending approval.	f	{"traineeId": 17, "traineeName": "Zone tester", "traineeEmail": "zone1@example.com"}	2025-09-18 16:07:07.973	2025-09-18 16:07:07.973
\.


--
-- Data for Name: Resource; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Resource" (id, url, filename, type, duration, "moduleId", "originalName", "filePath", "estimatedReadingTime", "createdAt", "updatedAt") FROM stdin;
5	/uploads/resources/resourceFile-1758301497356-853740097.pdf	resourceFile-1758301497356-853740097.pdf	PDF	\N	56	Targets and Management Expectations - Pankhuri Sharma (3).pdf	resourceFile-1758301497356-853740097.pdf	\N	2025-09-19 17:04:57.358	2025-09-19 17:04:57.358
6	/uploads/resources/resourceFile-1758301791002-815102761.pptx	resourceFile-1758301791002-815102761.pptx	DOCUMENT	\N	57	Agency Training Session - OG  (1).pptx	resourceFile-1758301791002-815102761.pptx	\N	2025-09-19 17:09:51.047	2025-09-19 17:09:51.047
7	/uploads/resources/resourceFile-1758301791002-815102761.pptx	resourceFile-1758301791002-815102761.pptx	DOCUMENT	\N	65	Agency Training Session - OG  (1).pptx	resourceFile-1758301791002-815102761.pptx	\N	2025-09-24 21:28:04.34	2025-09-24 21:28:04.34
8	/uploads/resources/resourceFile-1758301497356-853740097.pdf	resourceFile-1758301497356-853740097.pdf	PDF	\N	66	Targets and Management Expectations - Pankhuri Sharma (3).pdf	resourceFile-1758301497356-853740097.pdf	\N	2025-09-24 21:28:04.343	2025-09-24 21:28:04.343
\.


--
-- Data for Name: ResourceTimeTracking; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."ResourceTimeTracking" (id, "userId", "resourceId", "timeSpent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: TraineeProgress; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."TraineeProgress" (id, "userId", "moduleId", completed, score, "timeSpent", pass, "createdAt", status, "updatedAt") FROM stdin;
109	14	22	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
110	14	23	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
111	14	24	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
112	14	25	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
113	14	26	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
114	14	27	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
115	14	28	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
116	14	29	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
117	14	30	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
118	14	31	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
119	14	32	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
120	14	33	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
121	14	34	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
122	14	35	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
123	14	36	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
124	14	37	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
125	14	38	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
126	14	39	f	\N	0	f	2025-09-17 13:37:19.653	IN_PROGRESS	2025-09-17 13:37:19.653
127	4	48	f	\N	\N	f	2025-09-18 17:25:18.409	IN_PROGRESS	2025-09-18 17:25:18.409
129	14	48	f	\N	\N	f	2025-09-18 17:25:18.409	IN_PROGRESS	2025-09-18 17:25:18.409
130	4	49	f	\N	\N	f	2025-09-18 17:29:45.04	IN_PROGRESS	2025-09-18 17:29:45.04
132	14	49	f	\N	\N	f	2025-09-18 17:29:45.04	IN_PROGRESS	2025-09-18 17:29:45.04
133	4	50	f	\N	\N	f	2025-09-18 17:50:37.56	IN_PROGRESS	2025-09-18 17:50:37.56
135	14	50	f	\N	\N	f	2025-09-18 17:50:37.56	IN_PROGRESS	2025-09-18 17:50:37.56
157	4	51	f	\N	\N	f	2025-09-18 19:25:39.854	IN_PROGRESS	2025-09-18 19:25:39.854
159	14	51	f	\N	\N	f	2025-09-18 19:25:39.854	IN_PROGRESS	2025-09-18 19:25:39.854
169	4	56	f	\N	\N	f	2025-09-19 17:04:57.065	IN_PROGRESS	2025-09-19 17:04:57.065
171	14	56	f	\N	\N	f	2025-09-19 17:04:57.065	IN_PROGRESS	2025-09-19 17:04:57.065
173	4	57	f	\N	\N	f	2025-09-19 17:09:49.47	IN_PROGRESS	2025-09-19 17:09:49.47
175	14	57	f	\N	\N	f	2025-09-19 17:09:49.47	IN_PROGRESS	2025-09-19 17:09:49.47
177	4	58	f	\N	\N	f	2025-09-19 17:16:30.276	IN_PROGRESS	2025-09-19 17:16:30.276
179	14	58	f	\N	\N	f	2025-09-19 17:16:30.276	IN_PROGRESS	2025-09-19 17:16:30.276
181	4	59	f	\N	\N	f	2025-09-19 17:26:19.983	IN_PROGRESS	2025-09-19 17:26:19.983
183	14	59	f	\N	\N	f	2025-09-19 17:26:19.983	IN_PROGRESS	2025-09-19 17:26:19.983
185	17	59	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
186	17	48	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
187	17	49	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
188	17	56	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
189	17	51	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
190	17	39	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
191	17	50	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
192	17	57	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
193	17	22	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
194	17	58	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
195	17	23	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
196	17	24	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
197	17	25	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
198	17	26	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
199	17	27	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
200	17	28	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
201	17	29	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
202	17	30	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
203	17	31	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
204	17	32	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
205	17	33	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
206	17	34	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
207	17	35	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
208	17	36	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
209	17	37	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
210	17	38	f	\N	0	f	2025-09-24 13:19:04.589	IN_PROGRESS	2025-09-24 13:19:04.589
228	22	48	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
229	22	59	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
230	22	24	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
231	22	57	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
232	22	56	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
233	22	49	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
234	22	22	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
235	22	58	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
236	22	23	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
237	22	25	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
238	22	26	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
239	22	27	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
240	22	28	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
241	22	29	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
242	22	30	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
243	22	31	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
244	22	32	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
245	22	33	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
246	22	34	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
247	22	35	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
248	22	36	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
249	22	37	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
250	22	38	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
251	22	51	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
252	22	39	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
253	22	50	f	\N	0	f	2025-09-25 21:21:09.664	IN_PROGRESS	2025-09-25 21:21:09.664
\.


--
-- Data for Name: TrainingModule; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."TrainingModule" (id, name, "companyId", "order", "isResourceModule") FROM stdin;
48	What is Staffing/ Recruitment Agency	26	0	f
59	Orientation Package	26	1	f
24	PRICING STRUCTURE	26	6	f
80	STEPS TO FIND COMPANIES WITH OPEN POSITIONS USING INDEED	29	16	f
81	STEPS TO FIND COMPANIES WITH OPEN POSITIONS USING LINKEDIN	29	17	f
82	SUMMARY: USING INDEED AND LINKEDIN FOR LEAD GENERATION	29	18	f
83	BOTSOL CRAWLER AND STEPS TO USE	29	19	f
84	STEPS ON USING SALES NAVIGATOR	29	20	f
85	Important Designations to Target - Final	29	21	f
57	Agency Training Session	26	1	t
60	SUBCONTRACTING	29	22	f
61	WHEN WORKING ON TARGET COMPANIES PROVIDED BY YOUR ORGANIZATION FOR STAFFING SERVICES OUTREACH, HERE'S A SIMPLIFIED PROCESS:	29	23	f
62	STEPS FROM LEAD GENERATION TO CLOSER	29	24	f
63	Workflow of the clients from start to end	29	25	f
64	What is Staffing/ Recruitment Agency	29	0	f
65	Agency Training Session	29	1	t
66	Targets and Management Expectations 	29	2	t
67	Orientation Package	29	3	f
68	Where do we provide our services?	29	4	f
69	TYPES OF SERVICES THAT WE PROVIDE	29	5	f
70	Jobs position to target/ What industries to target/ Which hot areas to target	29	6	f
71	STAFFING LAWS, CLIENT EXPECTATIONS, AND RECRUITMENT PROCESSES (CAN VS PAK)	29	7	f
72	PRICING STRUCTURE	29	8	f
73	BDA ONHORE AND OFFSHORE TASK	29	9	f
74	STEPS TO SEND  AN EMAIL BLAST  USING GOOGLE  SHEETS AND  MAILSUITE	29	10	f
75	BENEFITS OF MAILSUITE	29	11	f
76	Key Features-Benefits and Examples of a Customized Email	29	12	f
77	Why Calling Clients is Importan & Effective Tone When Dealing with Clients	29	13	f
56	Targets and Management Expectations 	26	2	t
78	WHY FOLLOW-UP  EMAILS ARE  NECESSARY	29	14	f
79	STEPS TO Find One Email Using Apollo.io	29	15	f
49	Where do we provide our services?	26	2	f
22	TYPES OF SERVICES THAT WE PROVIDE	26	3	f
58	Jobs position to target/ What industries to target/ Which hot areas to target	26	4	f
23	STAFFING LAWS, CLIENT EXPECTATIONS, AND RECRUITMENT PROCESSES (CAN VS PAK)	26	5	f
25	BDA ONHORE AND OFFSHORE TASK	26	7	f
26	STEPS TO SEND  AN EMAIL BLAST  USING GOOGLE  SHEETS AND  MAILSUITE	26	8	f
27	BENEFITS OF MAILSUITE	26	9	f
28	Key Features-Benefits and Examples of a Customized Email	26	10	f
29	Why Calling Clients is Importan & Effective Tone When Dealing with Clients	26	11	f
30	WHY FOLLOW-UP  EMAILS ARE  NECESSARY	26	12	f
31	STEPS TO Find One Email Using Apollo.io	26	13	f
32	STEPS TO FIND COMPANIES WITH OPEN POSITIONS USING INDEED	26	14	f
33	STEPS TO FIND COMPANIES WITH OPEN POSITIONS USING LINKEDIN	26	15	f
34	SUMMARY: USING INDEED AND LINKEDIN FOR LEAD GENERATION	26	16	f
35	BOTSOL CRAWLER AND STEPS TO USE	26	17	f
36	STEPS ON USING SALES NAVIGATOR	26	18	f
37	Important Designations to Target - Final	26	19	f
38	SUBCONTRACTING	26	20	f
51	WHEN WORKING ON TARGET COMPANIES PROVIDED BY YOUR ORGANIZATION FOR STAFFING SERVICES OUTREACH, HERE'S A SIMPLIFIED PROCESS:	26	21	f
39	STEPS FROM LEAD GENERATION TO CLOSER	26	22	f
50	Workflow of the clients from start to end	26	23	f
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."User" (id, name, email, password, role, "companyId", "isVerified", status) FROM stdin;
1	Admin User	admin@example.com	$2a$12$O1PulBkbZ3NfhsoSrqwEAeb240dRlMRrOl322kRX1NcMdBp32/UVS	ADMIN	\N	t	PENDING
4	Jack	trainee@example.com	$2b$10$zddlnEWMFA4NEfpDLdzXCenx7QYf6wqDcs5q/oB876J0LM.jOcO.W	TRAINEE	26	t	APPROVED
10	Jam	deep@example.com	$2b$10$vVZ84DT988jRl3jhl/emkOAiQCQ7DF9sCCSVz7SnrJKBSaP0ARxR2	MANAGER	\N	t	APPROVED
13	Ezify Admin	admin@ezify.com	$2b$10$zIywsnU82GnElG8dOUjVeeqcGsCmYPNy8qRyfvwPJh2BhRGiqddM.	ADMIN	\N	t	PENDING
14	Hamza Fiaz	hamzafiaz@ezaccounts.ca	$2b$10$uKUar1AD5Hdfw/dAc3fRquhMz40oO9cXYdrnm/IXDmA2IrP1.xwtO	TRAINEE	26	t	APPROVED
17	Ahmad Iftakhar	ahmad@ezify.com	$2b$10$SulgYY/Uxrkea9ZQ/90YvuXxJnV/BXooRrqp92D1gT1etHZj9SWki	TRAINEE	26	t	APPROVED
19	Ezify Admin	dev@ezify.com	$2b$10$gcK/Cat2ldJl07oz8F7rauMACuEPUXtoCYJWez83GrtCqUknsQdkS	ADMIN	\N	t	PENDING
22	Abdul Hanan	hanan@gmail.com	$2b$10$godRppq8CW.RxMay8gthF.LBLCwrnYEW2BPY2wIze8XEforurfVbO	TRAINEE	26	t	APPROVED
\.


--
-- Data for Name: Video; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public."Video" (id, url, duration, "moduleId") FROM stdin;
78	1756218187619-163392759.mp4	1413	22
79	1756218680214-81717876.mp4	312	23
80	1756218980615-56860590.mp4	1087	24
81	1756219305974-530531361.mp4	452	25
82	1756219556800-781243242.mp4	528	26
83	1756219665264-809229441.mp4	193	27
84	1756219920763-932487953.mp4	339	28
85	1756220092332-771351086.mp4	450	29
86	1756220224426-522004447.mp4	251	30
87	1756220335605-67622819.mp4	485	31
88	1756220442867-159564583.mp4	326	32
89	1756220515965-140051735.mp4	271	33
90	1756220550411-822921973.mp4	239	34
91	1756220651396-119897358.mp4	370	35
92	1756220763812-575028106.mp4	320	36
93	1756220881700-47014297.mp4	277	37
94	1756221250316-748581544.mp4	356	38
95	1756221297080-155314038.mp4	456	39
97	/uploads/1758216321761-662897893.mp4	273	48
98	/uploads/1758216589131-864126103.mp4	162	49
99	/uploads/1758217851790-247272416.mp4	906	50
100	/uploads/1758223552911-809119727.mp4	381	51
102	/uploads/1758302202714-554060331.mp4	1010	58
103	/uploads/1758302785407-531449258.mp4	402	59
104	1756221250316-748581544.mp4	356	60
105	/uploads/1758223552911-809119727.mp4	381	61
106	1756221297080-155314038.mp4	456	62
107	/uploads/1758217851790-247272416.mp4	906	63
108	/uploads/1758216321761-662897893.mp4	273	64
109	/uploads/1758302785407-531449258.mp4	402	67
110	/uploads/1758216589131-864126103.mp4	162	68
111	1756218187619-163392759.mp4	1413	69
112	/uploads/1758302202714-554060331.mp4	1010	70
113	1756218680214-81717876.mp4	312	71
114	1756218980615-56860590.mp4	1087	72
115	1756219305974-530531361.mp4	452	73
116	1756219556800-781243242.mp4	528	74
117	1756219665264-809229441.mp4	193	75
118	1756219920763-932487953.mp4	339	76
119	1756220092332-771351086.mp4	450	77
120	1756220224426-522004447.mp4	251	78
121	1756220335605-67622819.mp4	485	79
122	1756220442867-159564583.mp4	326	80
123	1756220515965-140051735.mp4	271	81
124	1756220550411-822921973.mp4	239	82
125	1756220651396-119897358.mp4	370	83
126	1756220763812-575028106.mp4	320	84
127	1756220881700-47014297.mp4	277	85
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: dev
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
dcd84c92-6e93-43c8-8555-6cc7b4fff4aa	f487d8895bc30159cdcaba885b680be40cc25666d68f110de3eed8d06db92ea7	\N	20250904191647_init	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250904191647_init\n\nDatabase error code: 42501\n\nDatabase error:\nERROR: must be owner of table TrainingModule\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42501), message: "must be owner of table TrainingModule", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("aclchk.c"), line: Some(2950), routine: Some("aclcheck_error") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250904191647_init"\n             at schema-engine/connectors/sql-schema-connector/src/apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250904191647_init"\n             at schema-engine/commands/src/commands/apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine/core/src/state.rs:236	2025-09-24 21:23:51.228466+00	2025-09-24 20:34:44.004155+00	0
df0a9e22-b359-4932-9d3c-71accf750d71	c83b2d399ed488e1463e5b84a2ebce29f84f1e28947417f9cf17dffd03bec030	2025-09-16 18:34:41.363594+00	20250827205220_init	\N	\N	2025-09-16 18:34:41.289996+00	1
0a714e74-d0df-4dd3-a82b-90833572c91c	f487d8895bc30159cdcaba885b680be40cc25666d68f110de3eed8d06db92ea7	2025-09-24 21:23:51.230324+00	20250904191647_init		\N	2025-09-24 21:23:51.230324+00	0
73c419a4-195f-49bb-b08a-60237fe3c0e1	2db70b9717eb8c69a893307245450e09e5c5094fda3a5770ae069b54a6ca5efb	2025-09-16 18:34:41.379025+00	20250909140134_add_resource_support	\N	\N	2025-09-16 18:34:41.364564+00	1
cac4651a-a10a-4001-95e5-54c599afd3c5	f7394de768e03eea9ef9f639e4fbf871b3b2e2668117da9f7818ea19f6adf967	2025-09-16 18:34:41.395531+00	20250910212948_add_missing_fields	\N	\N	2025-09-16 18:34:41.380132+00	1
233bf786-14e9-48df-8dbe-39cde96680fc	42f919d17c5b6db68464a92bbad8a199e702f0b49a4dc598a898371d8ba17286	2025-08-25 16:46:54.301769+00	20250718183903_init	\N	\N	2025-08-25 16:46:54.263372+00	1
cc9378ab-2571-44d8-b2a0-7ecec42f1d62	b06156627f74ce5927a2e31e011d0329e894f99af3be0194a3caf9c9afa615b5	2025-08-25 16:46:54.312554+00	20250723151317_add_mcq_answer	\N	\N	2025-08-25 16:46:54.302399+00	1
997eaa54-e142-4916-ac65-a9b76b76b02a	1d17df8e6cc13960bd1121942f0335af02dd66ba55b292064c3a7a0237128cda	2025-08-25 16:46:54.321715+00	20250806162330_add_help_requests	\N	\N	2025-08-25 16:46:54.31298+00	1
49e8d9bb-e921-4f31-9ff0-687a76ede587	d98f4ca26f8833447e4b57d4b263f66c36356aeb947160aac2fbd38d48a4606e	2025-08-25 16:46:54.328913+00	20250806195605_add_feedback_table	\N	\N	2025-08-25 16:46:54.322244+00	1
ad625c4c-41db-4699-b656-3dd46a386897	2bd60b9aad94ec4a1c4b0ec6a9202045040dbb7d3aa9e3e116184dae6a892eca	2025-08-25 16:46:54.347281+00	20250822205906_add_chat_functionality	\N	\N	2025-08-25 16:46:54.329377+00	1
224f1677-5428-49fe-b288-8b2877ecc47f	3e1ac0fe9bcf74816de8ed9ae71996f4172bed1cc251a1872fb9a917df8f7aad	\N	20250825164506_add_notifications_and_progress_status	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20250825164506_add_notifications_and_progress_status\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "userId" of relation "Feedback" does not exist\n\nPosition:\n[1m 28[0m ALTER TABLE "TraineeProgress" ALTER COLUMN "status" SET NOT NULL;\n[1m 29[0m ALTER TABLE "TraineeProgress" ALTER COLUMN "createdAt" SET NOT NULL;\n[1m 30[0m ALTER TABLE "TraineeProgress" ALTER COLUMN "updatedAt" SET NOT NULL;\n[1m 31[0m\n[1m 32[0m -- Update existing Feedback records to set userId (assuming traineeId maps to userId)\n[1m 33[1;31m UPDATE "Feedback" SET "userId" = "traineeId";[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"userId\\" of relation \\"Feedback\\" does not exist", detail: None, hint: None, position: Some(Original(1541)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("analyze.c"), line: Some(2536), routine: Some("transformUpdateTargetList") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20250825164506_add_notifications_and_progress_status"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20250825164506_add_notifications_and_progress_status"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:236	2025-09-16 19:06:38.401925+00	2025-08-25 16:46:54.347851+00	0
\.


--
-- Name: Certificate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Certificate_id_seq"', 1, false);


--
-- Name: ChatMessage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."ChatMessage_id_seq"', 55, true);


--
-- Name: ChatRoomParticipant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."ChatRoomParticipant_id_seq"', 18, true);


--
-- Name: ChatRoom_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."ChatRoom_id_seq"', 50, true);


--
-- Name: Company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Company_id_seq"', 33, true);


--
-- Name: Feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Feedback_id_seq"', 1, false);


--
-- Name: HelpRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."HelpRequest_id_seq"', 4, true);


--
-- Name: MCQAnswer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."MCQAnswer_id_seq"', 19, true);


--
-- Name: MCQ_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."MCQ_id_seq"', 123, true);


--
-- Name: ManagerCompanyAssignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."ManagerCompanyAssignment_id_seq"', 8, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 5, true);


--
-- Name: ResourceTimeTracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."ResourceTimeTracking_id_seq"', 1, false);


--
-- Name: Resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Resource_id_seq"', 22, true);


--
-- Name: TraineeProgress_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."TraineeProgress_id_seq"', 253, true);


--
-- Name: TrainingModule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."TrainingModule_id_seq"', 140, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."User_id_seq"', 22, true);


--
-- Name: Video_id_seq; Type: SEQUENCE SET; Schema: public; Owner: dev
--

SELECT pg_catalog.setval('public."Video_id_seq"', 158, true);


--
-- Name: Certificate Certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: ChatRoomParticipant ChatRoomParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoomParticipant"
    ADD CONSTRAINT "ChatRoomParticipant_pkey" PRIMARY KEY (id);


--
-- Name: ChatRoom ChatRoom_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: Feedback Feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_pkey" PRIMARY KEY (id);


--
-- Name: HelpRequest HelpRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."HelpRequest"
    ADD CONSTRAINT "HelpRequest_pkey" PRIMARY KEY (id);


--
-- Name: MCQAnswer MCQAnswer_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQAnswer"
    ADD CONSTRAINT "MCQAnswer_pkey" PRIMARY KEY (id);


--
-- Name: MCQ MCQ_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQ"
    ADD CONSTRAINT "MCQ_pkey" PRIMARY KEY (id);


--
-- Name: ManagerCompanyAssignment ManagerCompanyAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ManagerCompanyAssignment"
    ADD CONSTRAINT "ManagerCompanyAssignment_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: ResourceTimeTracking ResourceTimeTracking_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ResourceTimeTracking"
    ADD CONSTRAINT "ResourceTimeTracking_pkey" PRIMARY KEY (id);


--
-- Name: Resource Resource_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Resource"
    ADD CONSTRAINT "Resource_pkey" PRIMARY KEY (id);


--
-- Name: TraineeProgress TraineeProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TraineeProgress"
    ADD CONSTRAINT "TraineeProgress_pkey" PRIMARY KEY (id);


--
-- Name: TrainingModule TrainingModule_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TrainingModule"
    ADD CONSTRAINT "TrainingModule_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Video Video_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Video"
    ADD CONSTRAINT "Video_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Certificate_certificateNumber_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "Certificate_certificateNumber_key" ON public."Certificate" USING btree ("certificateNumber");


--
-- Name: ChatRoomParticipant_userId_chatRoomId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "ChatRoomParticipant_userId_chatRoomId_key" ON public."ChatRoomParticipant" USING btree ("userId", "chatRoomId");


--
-- Name: Company_name_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "Company_name_key" ON public."Company" USING btree (name);


--
-- Name: ManagerCompanyAssignment_managerId_companyId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "ManagerCompanyAssignment_managerId_companyId_key" ON public."ManagerCompanyAssignment" USING btree ("managerId", "companyId");


--
-- Name: ResourceTimeTracking_userId_resourceId_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "ResourceTimeTracking_userId_resourceId_key" ON public."ResourceTimeTracking" USING btree ("userId", "resourceId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: dev
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Certificate Certificate_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Certificate Certificate_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatMessage ChatMessage_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatMessage ChatMessage_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ChatMessage ChatMessage_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatRoomParticipant ChatRoomParticipant_chatRoomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoomParticipant"
    ADD CONSTRAINT "ChatRoomParticipant_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES public."ChatRoom"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatRoomParticipant ChatRoomParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoomParticipant"
    ADD CONSTRAINT "ChatRoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChatRoom ChatRoom_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ChatRoom"
    ADD CONSTRAINT "ChatRoom_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feedback Feedback_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feedback Feedback_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Feedback"
    ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HelpRequest HelpRequest_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."HelpRequest"
    ADD CONSTRAINT "HelpRequest_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HelpRequest HelpRequest_traineeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."HelpRequest"
    ADD CONSTRAINT "HelpRequest_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MCQAnswer MCQAnswer_mcqId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQAnswer"
    ADD CONSTRAINT "MCQAnswer_mcqId_fkey" FOREIGN KEY ("mcqId") REFERENCES public."MCQ"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MCQAnswer MCQAnswer_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQAnswer"
    ADD CONSTRAINT "MCQAnswer_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MCQAnswer MCQAnswer_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQAnswer"
    ADD CONSTRAINT "MCQAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MCQ MCQ_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."MCQ"
    ADD CONSTRAINT "MCQ_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ManagerCompanyAssignment ManagerCompanyAssignment_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ManagerCompanyAssignment"
    ADD CONSTRAINT "ManagerCompanyAssignment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ManagerCompanyAssignment ManagerCompanyAssignment_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ManagerCompanyAssignment"
    ADD CONSTRAINT "ManagerCompanyAssignment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ResourceTimeTracking ResourceTimeTracking_resourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ResourceTimeTracking"
    ADD CONSTRAINT "ResourceTimeTracking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES public."Resource"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ResourceTimeTracking ResourceTimeTracking_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."ResourceTimeTracking"
    ADD CONSTRAINT "ResourceTimeTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Resource Resource_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Resource"
    ADD CONSTRAINT "Resource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TraineeProgress TraineeProgress_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TraineeProgress"
    ADD CONSTRAINT "TraineeProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TraineeProgress TraineeProgress_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TraineeProgress"
    ADD CONSTRAINT "TraineeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TrainingModule TrainingModule_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."TrainingModule"
    ADD CONSTRAINT "TrainingModule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Video Video_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: dev
--

ALTER TABLE ONLY public."Video"
    ADD CONSTRAINT "Video_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."TrainingModule"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: trainingportal_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO dev;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO dev;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO dev;


--
-- PostgreSQL database dump complete
--

\unrestrict lgvchqR92Mtuk2UKusoh1TVLDuolNfwFeaFxfkcmqfvGsxhhlGESUeNDB66oSmY

