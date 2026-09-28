# OnlineKurs frontend — page author reference

This file plus `SPEC.md` is everything you need to write a page. Everything listed here exists and is typechecked. Do not add new UI primitives when one here fits; do not call axios directly; do not invent query keys.

Stack: Vite 5, React 18, TypeScript strict, Tailwind 3.4, react-router-dom v6, @tanstack/react-query v5, axios, lucide-react, react-hook-form + zod + @hookform/resolvers, recharts (admin only), clsx + tailwind-merge.

Path alias: `@/` → `src/`. Scripts: `npm run dev | build | preview | lint | typecheck`. All three gates (`lint`, `typecheck`, `build`) must stay green; `--max-warnings 0` is on. ESLint enforces `import { type X }` for type-only imports.

---

## 1. Project map

```
src/
  api/          client.ts (axios + refresh), authApi, categoriesApi, coursesApi, teacherApi,
                sectionsApi, lessonsApi, enrollmentsApi, paymentsApi, adminApi, healthApi, queryKeys
  types/        every API shape (index.ts)
  lib/          utils.ts (formatting/cn), validation.ts (zod primitives with Uzbek messages)
  context/      AuthProvider, ThemeProvider, ToastProvider (+ <Toaster>)
  hooks/        useAuth, useTheme, useToast, useDebounce, useQueryParams, useMediaQuery, useDocumentTitle, useLockBodyScroll
  components/
    ui/         Button IconButton Input Textarea Select Checkbox Switch Badge Card(+Header/Body/Footer/StatCard)
                Modal ConfirmDialog Skeleton SkeletonText Spinner PageSpinner Avatar ProgressBar Tabs EmptyState
                Alert Pagination Table primitives FileDropzone StarRating Dropdown
    layout/     Container Logo LogoMark (no link; boot splash) ThemeToggle Navbar Footer PageHeader Sidebar MainLayout DashboardLayout LearnLayout
    course/     CourseCard CourseCardSkeleton CourseCover CourseGrid CurriculumAccordion RatingStars PriceTag LevelBadge VideoPlayer
    guards/     RequireAuth RequireRole GuestOnly ErrorBoundary ErrorFallback
  pages/        public/ student/ teacher/ admin/   (one default-exported component per file)
  router.tsx    route arrays per group (see §9)
  App.tsx       providers + RouterProvider + Toaster + boot splash
```

Import style: `import { Button, Input } from "@/components/ui";` — every folder has an `index.ts` barrel. Direct file imports (`@/components/ui/Button`) also work.

---

## 2. Types (`@/types`)

All names mirror SPEC §2.5, fields are snake_case:

`Role`, `CourseLevel`, `PaymentStatus`, `PriceFilter`, `CourseSort`
`UserPublic`, `Category`, `TeacherMini`, `CourseCard`, `CourseDetail` (extends CourseCard), `SectionOut`, `LessonOut`, `Enrollment`, `Payment`, `Review`, `ReviewUser`, `Tokens`, `Paginated<T>`, `CourseProgress`, `LessonCompleteResult`, `TeacherStats`, `AdminStats`, `MonthlyRevenue`, `HealthStatus`, `ApiError`

Payloads: `RegisterPayload`, `LoginPayload`, `RefreshPayload`, `UpdateMePayload`, `ChangePasswordPayload`, `CategoryCreatePayload`, `CategoryUpdatePayload`, `CourseCreatePayload`, `CourseUpdatePayload`, `PublishPayload`, `ReviewPayload`, `SectionCreatePayload`, `SectionUpdatePayload`, `SectionOrderPayload`, `LessonCreatePayload`, `LessonUpdatePayload`, `LessonOrderPayload`, `PaymentCreatePayload`, `AdminUserUpdatePayload`, `AdminPaymentUpdatePayload`

Query params: `PaginationParams`, `CourseListParams`, `AdminUsersParams`, `AdminCoursesParams`, `AdminPaymentsParams`. Upload callback: `UploadProgress = (percent: number) => void`.

---

## 3. API modules (`@/api`)

All functions return the unwrapped response body (`Promise<T>`), throw `AxiosError<ApiError>` on failure. Use `getErrorMessage(err)` to get the backend's Uzbek `detail` (falls back to a generic Uzbek message).

```ts
import { authApi, coursesApi, lessonsApi, getErrorMessage, queryKeys } from "@/api";
```

| Module | Function | Returns |
|---|---|---|
| `authApi` | `register(RegisterPayload)` | `Tokens` |
| | `login(LoginPayload)` | `Tokens` |
| | `refresh(RefreshPayload)` | `Tokens` |
| | `me()` | `UserPublic` |
| | `updateMe(UpdateMePayload)` | `UserPublic` |
| | `uploadAvatar(file: File, onProgress?)` | `UserPublic` |
| | `changePassword(ChangePasswordPayload)` | `Tokens` (old pair revoked; store the new one) |
| `categoriesApi` | `list()` | `Category[]` |
| | `create(CategoryCreatePayload)` / `update(id, CategoryUpdatePayload)` | `Category` |
| | `remove(id)` | `void` |
| `coursesApi` | `list(params?: CourseListParams)` | `Paginated<CourseCard>` |
| | `featured()` | `CourseCard[]` |
| | `get(slug)` / `getById(id)` | `CourseDetail` (same endpoint; the editor route carries the id) |
| | `create(CourseCreatePayload)` / `update(id, CourseUpdatePayload)` | `CourseDetail` |
| | `remove(id)` | `void` |
| | `uploadCover(id, file, onProgress?)` | `CourseDetail` |
| | `publish(id, { is_published })` | `CourseDetail` |
| | `reviews(id, params?: PaginationParams)` | `Paginated<Review>` |
| | `review(id, ReviewPayload)` | `Review` (create or update own) |
| | `progress(id)` | `CourseProgress` |
| | `enroll(id)` | `Enrollment` (free courses only) |
| `teacherApi` | `courses()` | `CourseCard[]` |
| | `stats()` | `TeacherStats` |
| `sectionsApi` | `create(courseId, { title })` | `SectionOut` |
| | `update(id, { title? })` | `SectionOut` |
| | `remove(id)` | `void` |
| | `reorder(courseId, { section_ids })` | `SectionOut[]` |
| `lessonsApi` | `create(sectionId, LessonCreatePayload)` | `LessonOut` |
| | `get(id)` | `LessonOut` (403 when locked) |
| | `update(id, LessonUpdatePayload)` | `LessonOut` |
| | `remove(id)` | `void` |
| | `reorder(sectionId, { lesson_ids })` | `LessonOut[]` |
| | `uploadVideo(id, file, onProgress?)` | `LessonOut` |
| | `uploadAttachment(id, file, onProgress?)` | `LessonOut` |
| | `complete(id)` / `uncomplete(id)` | `LessonCompleteResult` |
| `enrollmentsApi` | `mine()` | `Enrollment[]` |
| `paymentsApi` | `mine()` | `Payment[]` |
| | `create({ course_id })` | `Payment` (pending) |
| | `confirm(id)` | `Payment` (paid + enrollment created) |
| | `cancel(id)` | `Payment` (failed) |
| `adminApi` | `stats()` | `AdminStats` |
| | `users(params?: AdminUsersParams)` | `Paginated<UserPublic>` |
| | `updateUser(id, AdminUserUpdatePayload)` | `UserPublic` |
| | `removeUser(id)` | `void` |
| | `courses(params?: AdminCoursesParams)` | `Paginated<CourseCard>` |
| | `payments(params?: AdminPaymentsParams)` | `Paginated<Payment>` |
| | `updatePayment(id, { status })` | `Payment` |
| `healthApi` | `check()` | `HealthStatus` |

Client details (`@/api/client`): `API_URL`, `API_BASE`, `api` (axios instance), `tokenStorage.{getAccess,getRefresh,set,clear}` (localStorage keys `ok_access` / `ok_refresh`), `LOGOUT_EVENT` (window event fired when refresh fails; AuthProvider listens). On a 401 the client refreshes once and retries the request; if that fails it clears tokens and emits logout. Upload calls have no timeout and report progress via `onProgress(0..100)`.

### Query keys (`queryKeys` from `@/api`)

```ts
queryKeys.me                         // ["me"]
queryKeys.categories                 // ["categories"]
queryKeys.courses.all                // ["courses"]            (prefix for invalidation)
queryKeys.courses.list(params)       // ["courses","list",params]
queryKeys.courses.featured           // ["courses","featured"]
queryKeys.course(slug)               // ["course",slug]
queryKeys.reviews(courseId, params?) // ["reviews",courseId,params]
queryKeys.progress(courseId)         // ["progress",courseId]
queryKeys.lesson(id)                 // ["lesson",id]
queryKeys.enrollments                // ["enrollments"]
queryKeys.payments                   // ["payments"]
queryKeys.teacher.all / .courses / .stats
queryKeys.admin.all / .stats / .users(params?) / .courses(params?) / .payments(params?)
```

Invalidate after mutations (`queryClient.invalidateQueries({ queryKey: ... })`):

| Mutation | Invalidate |
|---|---|
| course create / update / cover / publish / delete | `courses.all`, `course(slug)`, `teacher.all`, `admin.all` |
| section / lesson mutation, uploads | `course(slug)` |
| enroll / payment confirm | `course(slug)`, `enrollments`, `payments`, `me` not needed |
| lesson complete / uncomplete | `course(slug)`, `progress(courseId)`, `enrollments` |
| review | `reviews(courseId)`, `course(slug)` |
| profile / avatar / password | call `setUser(result)` from `useAuth()` (no query) |
| admin user / payment / category change | matching `admin.*`, `admin.stats`, `categories` |

Pattern:

```tsx
const queryClient = useQueryClient();
const toast = useToast();
const mutation = useMutation({
  mutationFn: (payload: CourseCreatePayload) => coursesApi.create(payload),
  onSuccess: (course) => {
    toast.success("Kurs yaratildi");
    queryClient.invalidateQueries({ queryKey: queryKeys.teacher.all });
    navigate(`/teacher/courses/${course.id}/edit`);
  },
  onError: (err) => toast.error(getErrorMessage(err)),
});
```

QueryClient defaults (App.tsx): `staleTime` 60s, no refetch on focus, no retry for 4xx, one retry for network/5xx, mutations never retry.

---

## 4. Providers and hooks

Provider order in `App.tsx`: `ErrorBoundary > ThemeProvider > QueryClientProvider > ToastProvider > AuthProvider > (RouterProvider + Toaster)`. While `/auth/me` restores the session a full-screen splash renders instead of the router, so pages never see `isLoading === true` from `useAuth` in practice; guards still handle it.

### `useAuth()`
```ts
{
  user: UserPublic | null;
  isLoading: boolean;            // boot restore in flight
  isAuthenticated: boolean;
  role: Role | null;
  isStudent: boolean; isTeacher: boolean; isAdmin: boolean;
  canTeach: boolean;             // teacher || admin
  login(payload: LoginPayload): Promise<UserPublic>;
  register(payload: RegisterPayload): Promise<UserPublic>;
  logout(): void;                // clears tokens + query cache
  setUser(user: UserPublic): void;   // after PATCH /auth/me, avatar upload
  refreshUser(): Promise<UserPublic | null>;
}
```
`login`/`register` store tokens and set `user`; they throw on failure — wrap in try/catch and `toast.error(getErrorMessage(err))`. After login on `/login?next=/x` navigate to `next` (GuestOnly also does this automatically once `isAuthenticated` flips, but only for safe relative paths).

### `useTheme()` → `{ theme: "light" | "dark", isDark, setTheme(t), toggleTheme() }`
Persisted at `localStorage.ok_theme`; follows `prefers-color-scheme` until the user toggles. `index.html` applies the class before paint (no flash).

### `useToast()` → `{ success(title, opts?), error(title, opts?), info(title, opts?), show(kind, title, opts?), dismiss(id) }`
`opts = { description?: string; duration?: number }` (default 4000 ms, errors 6000, `0` = sticky). Stacked bottom-right, max 5.

### `useDebounce<T>(value, delay = 300): T`

### `useQueryParams()`
```ts
{
  params: Record<string,string>;   // all current params
  searchParams: URLSearchParams;
  get(key, fallback = ""): string;
  getNumber(key, fallback): number;
  getBoolean(key, fallback = false): boolean;
  set(key, value, { replace? }): void;          // "", null, undefined, false remove the key
  setMany({ q: "python", page: 1 }): void;      // one history entry
  remove(...keys): void;
  clear(): void;
}
```
Default history mode is `replace: true` (filters don't pollute Back).

### `useMediaQuery("(min-width: 1024px)")`, `useDocumentTitle("Kurslar")` (sets `"<title> — OnlineKurs"`), `useLockBodyScroll(locked)`.

---

## 5. Formatting helpers (`@/lib/utils`)

| Function | Example |
|---|---|
| `cn(...classes)` | tailwind-merge + clsx |
| `formatPrice(199000)` → `"199 000 so'm"`, `formatPrice(0)` → `"Bepul"` | |
| `formatNumber(1234567)` → `"1 234 567"` | |
| `formatCompact(1500)` → `"1.5 ming"` | stat tiles |
| `formatDuration(80)` → `"1 soat 20 daqiqa"`; `formatDurationShort(80)` → `"1s 20d"` | |
| `formatDate(iso)` → `"12-yanvar, 2026"`; `formatDateTime(iso)` → `"12-yanvar, 2026, 10:05"` | |
| `formatMonth("2026-03")` → `"mar 2026"` | chart axes |
| `formatRating(4.456)` → `"4.5"` | |
| `formatBytes(1536000)` → `"1.5 MB"` | |
| `getInitials("Aziz Toshmatov")` → `"AT"` | |
| `isYouTubeUrl(url)`, `toYouTubeEmbed(url)` → embed URL or `null` | |
| `levelLabel("beginner")` → `"Boshlang'ich"`, `levelColor(level)` → BadgeTone; `LEVEL_LABELS` | |
| `roleLabel("teacher")` → `"O'qituvchi"`; `ROLE_LABELS` | |
| `paymentStatusLabel("paid")` → `"To'langan"`, `paymentStatusColor("paid")` → `"success"`; `PAYMENT_STATUS_LABELS` | |
| `languageLabel("uz")` → `"O'zbek"` | |
| `categoryGradient(slug)` → Tailwind `from-… via-… to-…` string (stable per key) | |
| `clampPercent(n)`, `truncate(text, max)`, `studentsLabel(n)`, `lessonsLabel(n)`, `sleep(ms)` | |
| `UZ_MONTHS` | month names array |

Level / role / payment status option arrays for `<Select>`: build from the `*_LABELS` records: `Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }))`.

### Validation (`@/lib/validation`)
`emailSchema`, `passwordSchema` (≥ 8), `fullNameSchema` (≥ 2), `phoneSchema` (optional), `requiredString(label)`, `priceSchema` (int ≥ 0, coerced), `ratingSchema` (1..5), `zodMessages`. Compose:

```ts
const schema = z.object({ email: emailSchema, password: passwordSchema });
type FormValues = z.infer<typeof schema>;
const form = useForm<FormValues>({ resolver: zodResolver(schema) });
<Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
```

---

## 6. UI primitives (`@/components/ui`)

All components accept `className` and are dark-mode complete. Icon buttons need `aria-label`.

```ts
// Button
<Button variant="primary|secondary|outline|ghost|danger|gradient" size="xs|sm|md|lg"
        loading leftIcon rightIcon fullWidth type="button|submit" ...ButtonHTMLAttributes />
<IconButton aria-label="..." variant size="sm|md|lg" loading />        // square icon-only
buttonClassName({ variant, size, fullWidth, className })               // for <Link>/<a> styled as button

// Form controls (forwardRef — spread react-hook-form register())
<Input label error hint leftIcon rightIcon rightElement size="sm|md|lg" containerClassName ...InputHTMLAttributes />
<Textarea label error hint rows containerClassName />
<Select label error hint options={SelectOption[]} placeholder size containerClassName />   // SelectOption {value,label,disabled?}
<Checkbox label description error />                                   // forwardRef, native checkbox
<Switch checked onChange(bool) label description disabled size="sm|md" aria-label />   // controlled
<Label htmlFor required>, <FieldMessage error hint>, controlClassName(hasError)

// Display
<Badge tone="neutral|primary|success|warning|danger|info" size="sm|md" dot icon />
<Card hoverable flush> <CardHeader title description actions /> <CardBody /> <CardFooter /> </Card>
<StatCard label value icon hint tone="primary|success|warning|danger|info" />
<Avatar src name size="xs|sm|md|lg|xl" />                              // image or gradient initials
<ProgressBar value showLabel size="xs|sm|md" tone="gradient|primary|success" label />
<StarRating value onChange? size="sm|md|lg" showValue count disabled label />   // onChange → input mode
<Skeleton className="h-4 w-32" count />  <SkeletonText lines />
<Spinner size="xs|sm|md|lg" />  <PageSpinner />
<Alert tone="info|success|warning|danger" title onClose action icon>children</Alert>
<EmptyState icon title description action size="sm|md" />
<Tabs tabs={TabItem<T>[]} value onChange variant="underline|pills" label />   // TabItem {value,label,icon?,count?,disabled?}
<Pagination page pages onChange total />                              // renders nothing when pages <= 1

// Overlays
<Modal open onClose title description footer size="sm|md|lg|xl" closeOnOverlay>children</Modal>   // portal, ESC, focus trap, bottom-sheet on mobile
<ConfirmDialog open onClose onConfirm title description confirmText cancelText tone="danger|primary" loading />
<Dropdown trigger={({open,toggle}) => <button onClick={toggle}/>} align="left|right" closeOnClick>
  <DropdownItem icon onClick danger />  <DropdownSeparator />
</Dropdown>

// Tables
<TableContainer> <Table> <THead><TR><TH align>…</TH></TR></THead>
  <TBody> <TR hoverable><TD align>…</TD></TR>
          <TableSkeletonRows rows cols />  <TableEmptyRow colSpan>…</TableEmptyRow> </TBody>
</Table> </TableContainer>

// Upload
<FileDropzone onFile(file) accept maxSize(bytes) progress?(0..100) file onClear label hint error disabled icon />
```

`FileDropzone` pattern with progress:

```tsx
const [progress, setProgress] = useState<number>();
const upload = useMutation({
  mutationFn: (file: File) => lessonsApi.uploadVideo(lesson.id, file, setProgress),
  onSettled: () => setProgress(undefined),
});
<FileDropzone accept="video/mp4,video/webm,video/quicktime" maxSize={500 * 1024 * 1024}
              progress={progress} onFile={(f) => upload.mutate(f)} />
```

---

## 7. Course components (`@/components/course`)

```ts
<CategoryIcon name={category.icon} className />                          // lucide icon by stored name, book fallback; CATEGORY_ICON_OPTIONS = admin <Select> options
<CourseCard course={CourseCard} progressPercent? to? showStatus? />     // link to /courses/:slug; progress replaces price
<CourseCardSkeleton />
<CourseCover course={{title,cover_url,category}} className letterClassName />   // image or gradient + first letter (use for detail hero too)
<CourseGrid courses loading skeletonCount empty={<EmptyState/>} columns={3|4} progressByCourseId linkFor showStatus />
<CurriculumAccordion sections activeLessonId onSelect(lesson, section) defaultOpen="all|first|active" dense />
   // icons: check (completed) / play (accessible or preview) / lock; "Bepul ko'rish" badge; durations
<RatingStars value showValue count />                                    // = StarRating
<PriceTag price size="sm|md|lg" />                                       // "199 000 so'm" or emerald "Bepul"
<LevelBadge level size />
<VideoPlayer src title poster locked lockedContent autoPlay onEnded />   // <video> for files, iframe for YouTube, 16:9
```

---

## 8. Layouts, navigation and guards

- `Container` — `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`; `size="sm|md|lg|xl"`, `as="section|main|…"`.
- `MainLayout` — Navbar + `<Outlet>` + Footer (public pages). Pages render their own `<Container>` with `py-8 sm:py-12`.
- `DashboardLayout` — Navbar + role-aware sidebar (desktop) / "Menyu" drawer (mobile) + Footer. Content is already inside a `Container` with vertical padding; start pages with `<PageHeader>`, do not add another Container.
- `LearnLayout` — Navbar + full-height `<main class="flex min-h-0 flex-1 flex-col">`, no footer. Use `flex-1 min-h-0 overflow-y-auto` children for independent scrolling columns.
- `PageHeader` — `title description actions breadcrumbs={[{label,to?}]}` + `children` (e.g. a `<Tabs>` strip).
- `Navbar` — logo, "Kurslar", role link (student "Kurslarim" → /my-courses, teacher "O'qituvchi paneli" → /teacher, admin "Admin paneli" → /admin), search toggle (routes to `/courses?q=`), theme toggle, user dropdown (Boshqaruv paneli, Profil, panel link, Chiqish), guest buttons Kirish / Ro'yxatdan o'tish, mobile drawer with the same sidebar groups.
- Sidebar items (`navGroupsForRole(role)` in `layout/navigation.ts`): student: Boshqaruv `/dashboard`, Kurslarim `/my-courses`, To'lovlarim `/payments`, Profil `/profile`; teacher adds O'qituvchi paneli `/teacher`, Yangi kurs `/teacher/courses/new`; admin adds Statistika `/admin`, Foydalanuvchilar `/admin/users`, Kurslar `/admin/courses`, To'lovlar `/admin/payments`, Kategoriyalar `/admin/categories`.
- Guards (route-level, render `<Outlet>`): `RequireAuth` (→ `/login?next=`), `RequireRole roles={["teacher"]} fallback="/dashboard"` (admin always passes), `GuestOnly` (signed-in → `?next` or `/dashboard`).
- `ErrorBoundary children fallback?(error, reset) resetKey?` and `ErrorFallback error message onRetry className` — use `ErrorFallback` for failed queries: `if (query.isError) return <ErrorFallback message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />`.

---

## 9. Router (`src/router.tsx`)

Pages are default exports, lazily imported at the top of the file and listed in the group array that matches the access rule; the layouts and guards are wired once around each group:

```tsx
const HomePage = lazy(() => import("@/pages/public/HomePage"));
const publicRoutes: RouteObject[] = [
  { index: true, element: <Lazy><HomePage /></Lazy> },
  { path: "courses/:slug", element: <Lazy><CourseDetailPage /></Lazy> },
];
```

Groups: `publicRoutes` (MainLayout), `guestRoutes` (MainLayout + GuestOnly — login, register), `studentRoutes` (DashboardLayout + RequireAuth — dashboard, my-courses, checkout, profile, payments), `learnRoutes` (LearnLayout + RequireAuth — learn/:slug), `teacherRoutes` (DashboardLayout + RequireRole teacher — teacher, teacher/courses/new, teacher/courses/:id/edit), `adminRoutes` (DashboardLayout + RequireRole admin — admin, admin/users, admin/courses, admin/payments, admin/categories). Paths are absolute-from-root without leading slash. `*` → NotFoundPage is mounted under MainLayout. Vite emits one chunk per page group (`pages-public`, `pages-student`, `pages-teacher`, `pages-admin`), so a new page belongs in `src/pages/<group>/`. Access to `/learn/:slug` is enforced in the page: if `course.has_access` is false, `toast.error(...)` and `navigate(`/courses/${slug}`)`.

---

## 10. Visual rules

- **Page skeleton**: public page = `<Container className="py-8 sm:py-12 animate-in">`; dashboard page = `<div className="animate-in"><PageHeader … /> …</div>`. Section gaps `space-y-8` / `gap-6`. Card grids `grid gap-5 sm:grid-cols-2 lg:grid-cols-3`. Stat tile rows `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`.
- **Typography**: page title via `PageHeader` (`text-2xl sm:text-3xl font-semibold tracking-tight`); section headings `text-lg font-semibold`; body `text-sm text-slate-600 dark:text-slate-400`; hero display `text-5xl md:text-6xl font-bold tracking-tight` with one word in `ok-gradient-text`.
- **Colors**: brand `primary-*` (indigo); gradient only via `ok-gradient-bg` / `ok-gradient-text` / `variant="gradient"` (hero word, primary CTA, progress bars). Neutrals `slate`. Success `emerald`, warning `amber`, danger `rose`, info `sky`. Text pairs: `text-slate-900 dark:text-slate-100`, muted `text-slate-500 dark:text-slate-400`, borders `border-slate-200 dark:border-slate-800`, surfaces `bg-white dark:bg-slate-900`, page `bg-slate-50 dark:bg-slate-950` (already on body).
- **Cards**: use `<Card>` or the `ok-card` class (`rounded-2xl border bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-sm hover:shadow-lg transition`). Clickable cards add `hoverable` (`hover:-translate-y-0.5`).
- **Hero glow**: wrap the hero in `relative overflow-hidden` and add `<div className="ok-hero-glow absolute inset-0 -z-10" aria-hidden />`.
- **Motion**: `animate-in` (fade+rise) on page content; `animate-in-scale` for popovers; `animate-in-left` for drawers; `animate-shimmer` is used by `ok-skeleton`. Nothing else.
- **Focus**: interactive custom elements get `ok-focus`. Icon-only buttons get `aria-label`. Inputs always have `label`.
- **Loading**: lists → `CourseGrid loading` / `TableSkeletonRows` / `Skeleton` shaped like the final content, never a bare spinner for page content. Buttons in submitting forms → `loading` (they disable themselves). Page-level fallback → `PageSpinner` (used by Suspense).
- **Empty**: `<EmptyState icon={<BookOpen className="h-7 w-7" />} title="Hali kurslar yo'q" description="…" action={<Link className={buttonClassName()} to="/courses">Kurslarni ko'rish</Link>} />`.
- **Error**: `ErrorFallback` with `onRetry`; mutation errors → `toast.error(getErrorMessage(err))`. Every mutation shows a success toast.
- **Forms**: react-hook-form + zod, Uzbek messages via `@/lib/validation`, `<Input error={errors.x?.message}>`, submit button `type="submit" loading={isSubmitting || mutation.isPending}`.
- **Responsive**: mobile-first, test 375 / 768 / 1280. Tables live in `TableContainer` (scrolls horizontally, `min-w-[640px]`). Never allow horizontal page scroll; use `min-w-0` on flex children and `truncate`/`line-clamp-2` on long titles.
- **Text**: all UI strings in Uzbek Latin (`so'm`, `o'qituvchi` with the `'` apostrophe). Prices via `formatPrice`, durations via `formatDuration`, dates via `formatDate`.
- **Sticky sidebars** (course detail purchase card): `lg:sticky lg:top-24`. Navbar is 64px tall (`h-16`) and sticky at `z-40`; modals are `z-50`, toasts `z-[100]`.

---

## 11. Common page recipes

Fetching with a skeleton and error state:

```tsx
const q = useQuery({ queryKey: queryKeys.course(slug), queryFn: () => coursesApi.get(slug), enabled: Boolean(slug) });
if (q.isPending) return <CourseDetailSkeleton />;          // local skeleton composed from <Skeleton>
if (q.isError) return <ErrorFallback message={getErrorMessage(q.error)} onRetry={() => q.refetch()} />;
const course = q.data;
```

URL-synced filters (courses page):

```tsx
const { get, getNumber, setMany } = useQueryParams();
const params: CourseListParams = { q: get("q") || undefined, category: get("category") || undefined,
  level: (get("level") || undefined) as CourseLevel | undefined, price: (get("price") || undefined) as PriceFilter | undefined,
  sort: (get("sort") || "newest") as CourseSort, page: getNumber("page", 1), page_size: 12 };
const list = useQuery({ queryKey: queryKeys.courses.list(params), queryFn: () => coursesApi.list(params), placeholderData: keepPreviousData });
<Pagination page={params.page!} pages={list.data?.pages ?? 1} total={list.data?.total} onChange={(p) => setMany({ page: p })} />
```

Delete with confirmation:

```tsx
const [target, setTarget] = useState<CourseCard | null>(null);
<ConfirmDialog open={Boolean(target)} onClose={() => setTarget(null)} title="Kursni o'chirasizmi?"
  description={`"${target?.title}" butunlay o'chiriladi.`} confirmText="O'chirish" loading={del.isPending}
  onConfirm={() => del.mutateAsync(target!.id)} />
```

Role-aware CTA on course detail: `canTeach && (user.id === course.teacher.id || isAdmin)` → "Tahrirlash" link to `/teacher/courses/${course.id}/edit`; `course.is_enrolled || course.has_access` → "Davom etish" `/learn/${slug}`; `course.price === 0` → "Kursga yozilish" (`coursesApi.enroll`); else "Sotib olish" → `/checkout/${slug}`. Guests → `/login?next=/courses/${slug}`.
