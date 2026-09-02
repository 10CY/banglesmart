"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";


type ReviewStatus =
  | "pending"
  | "approved"
  | "rejected";


type Review = {

  id: number;

  rating: number;

  title:
    | string
    | null;

  comment:
    | string
    | null;

  status:
    ReviewStatus;

  created_at:
    string;

  updated_at?:
    string;

  product?: {

    id: number;

    name: string;

    slug: string;

  };

  user?: {

    id: number;

    name: string;

    email: string;

  };

};


type ReviewStats = {

  total: number;

  pending: number;

  approved: number;

  rejected: number;

  average_rating: number;

};


type Pagination = {

  current_page: number;

  last_page: number;

  per_page: number;

  total: number;

};


export default function AdminReviewsPage() {


  const [
    reviews,
    setReviews,
  ] = useState<Review[]>([]);


  const [
    stats,
    setStats,
  ] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    average_rating: 0,
  });


  const [
    pagination,
    setPagination,
  ] = useState<Pagination>({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    searchInput,
    setSearchInput,
  ] = useState("");


  const [
    status,
    setStatus,
  ] = useState("");


  const [
    rating,
    setRating,
  ] = useState("");


  const [
    page,
    setPage,
  ] = useState(1);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    actionId,
    setActionId,
  ] = useState<number | null>(
    null
  );


  /*
  |--------------------------------------------------------------------------
  | Load Reviews
  |--------------------------------------------------------------------------
  */

  const loadReviews =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");


          const params =
            new URLSearchParams();


          params.set(
            "page",
            String(page)
          );


          params.set(
            "limit",
            "10"
          );


          if (search) {

            params.set(
              "search",
              search
            );

          }


          if (status) {

            params.set(
              "status",
              status
            );

          }


          if (rating) {

            params.set(
              "rating",
              rating
            );

          }


          const response =
            await apiFetch(
              `/admin/reviews?${params.toString()}`
            );


          const json =
            await response.json();


          if (!response.ok) {

            throw new Error(
              json?.message ||
                "Unable to load reviews."
            );

          }


          const result =
            json.data;


          setReviews(
            result?.data || []
          );


          setPagination({

            current_page:
              Number(
                result?.current_page || 1
              ),

            last_page:
              Number(
                result?.last_page || 1
              ),

            per_page:
              Number(
                result?.per_page || 10
              ),

            total:
              Number(
                result?.total || 0
              ),

          });


          if (result?.stats) {

            setStats({

              total:
                Number(
                  result.stats.total || 0
                ),

              pending:
                Number(
                  result.stats.pending || 0
                ),

              approved:
                Number(
                  result.stats.approved || 0
                ),

              rejected:
                Number(
                  result.stats.rejected || 0
                ),

              average_rating:
                Number(
                  result.stats.average_rating || 0
                ),

            });

          }

        } catch (exception) {

          setError(
            exception instanceof Error
              ? exception.message
              : "Unable to load reviews."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        page,
        search,
        status,
        rating,
      ]
    );


  useEffect(() => {

    void loadReviews();

  }, [loadReviews]);


  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  function submitSearch() {

    setPage(1);

    setSearch(
      searchInput.trim()
    );

  }


  function clearFilters() {

    setSearchInput("");

    setSearch("");

    setStatus("");

    setRating("");

    setPage(1);

  }


  /*
  |--------------------------------------------------------------------------
  | Update Review
  |--------------------------------------------------------------------------
  */

  async function updateReview(
    review: Review,
    nextStatus: ReviewStatus
  ) {

    try {

      setActionId(
        review.id
      );

      setError("");


      const response =
        await apiFetch(
          `/admin/reviews/${review.id}`,
          {

            method: "PUT",

            body:
              JSON.stringify({
                status:
                  nextStatus,
              }),

          }
        );


      const json =
        await response.json();


      if (!response.ok) {

        throw new Error(
          json?.message ||
            "Unable to update review."
        );

      }


      await loadReviews();

    } catch (exception) {

      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to update review."
      );

    } finally {

      setActionId(null);

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  async function deleteReview(
    review: Review
  ) {

    const confirmed =
      window.confirm(
        "Delete this review permanently? This action cannot be undone."
      );


    if (!confirmed) {

      return;

    }


    try {

      setActionId(
        review.id
      );

      setError("");


      const response =
        await apiFetch(
          `/admin/reviews/${review.id}`,
          {
            method: "DELETE",
          }
        );


      const json =
        await response.json();


      if (!response.ok) {

        throw new Error(
          json?.message ||
            "Unable to delete review."
        );

      }


      /*
      |--------------------------------------------------------------------------
      | If last item on page is deleted,
      | move to previous page.
      |--------------------------------------------------------------------------
      */

      if (
        reviews.length === 1 &&
        page > 1
      ) {

        setPage(
          value =>
            value - 1
        );

      } else {

        await loadReviews();

      }

    } catch (exception) {

      setError(
        exception instanceof Error
          ? exception.message
          : "Unable to delete review."
      );

    } finally {

      setActionId(null);

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Rating Stars
  |--------------------------------------------------------------------------
  */

  function renderStars(
    value: number
  ) {

    return (

      <div className="flex items-center gap-0.5">

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <Star
              key={star}
              size={15}
              fill={
                star <= value
                  ? "currentColor"
                  : "none"
              }
              className={
                star <= value
                  ? "text-[#c9a227]"
                  : "text-gray-300"
              }
            />

          )
        )}

      </div>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | Date
  |--------------------------------------------------------------------------
  */

  function formatDate(
    value: string
  ) {

    if (!value) {

      return "—";

    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Active Filters
  |--------------------------------------------------------------------------
  */

  const hasFilters =
    Boolean(
      search ||
      status ||
      rating
    );


  /*
  |--------------------------------------------------------------------------
  | Page Range
  |--------------------------------------------------------------------------
  */

  const pageInfo =
    useMemo(() => {

      if (
        pagination.total === 0
      ) {

        return "0 reviews";

      }


      const from =
        (
          pagination.current_page -
          1
        ) *
          pagination.per_page +
        1;


      const to =
        Math.min(
          pagination.current_page *
            pagination.per_page,
          pagination.total
        );


      return `${from}–${to} of ${pagination.total}`;

    }, [pagination]);


  return (

    <div>

      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a227]">

            Customer Voice

          </p>


          <h1 className="mt-2 text-3xl font-semibold text-gray-900">

            Reviews

          </h1>


          <p className="mt-1 text-sm text-gray-500">

            Review, moderate and manage customer feedback.

          </p>

        </div>


        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3">

          <Star
            size={18}
            fill="currentColor"
            className="text-[#c9a227]"
          />


          <div>

            <p className="text-lg font-semibold leading-none text-gray-900">

              {stats.average_rating.toFixed(
                1
              )}

            </p>


            <p className="mt-1 text-[11px] text-gray-400">

              Average rating

            </p>

          </div>

        </div>

      </div>


      {/* ================================================================ */}
      {/* ERROR                                                            */}
      {/* ================================================================ */}

      {error && (

        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}


      {/* ================================================================ */}
      {/* STATS                                                            */}
      {/* ================================================================ */}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">


        <StatCard
          label="Total Reviews"
          value={stats.total}
          icon={
            <MessageSquare
              size={19}
            />
          }
        />


        <StatCard
          label="Pending"
          value={stats.pending}
          icon={
            <MessageSquare
              size={19}
            />
          }
          valueClass="text-amber-600"
        />


        <StatCard
          label="Approved"
          value={stats.approved}
          icon={
            <Check
              size={20}
            />
          }
          valueClass="text-green-600"
        />


        <StatCard
          label="Rejected"
          value={stats.rejected}
          icon={
            <X
              size={20}
            />
          }
          valueClass="text-red-600"
        />

      </div>


      {/* ================================================================ */}
      {/* FILTERS                                                          */}
      {/* ================================================================ */}

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">

        <div className="flex flex-col gap-3 xl:flex-row">


          {/* Search */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />


            <input
              value={
                searchInput
              }
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {

                if (
                  event.key ===
                  "Enter"
                ) {

                  submitSearch();

                }

              }}
              placeholder="Search product, customer, title or review..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
            />

          </div>


          {/* Status */}

          <select
            value={status}
            onChange={(event) => {

              setStatus(
                event.target.value
              );

              setPage(1);

            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
          >

            <option value="">
              All Statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="approved">
              Approved
            </option>

            <option value="rejected">
              Rejected
            </option>

          </select>


          {/* Rating */}

          <select
            value={rating}
            onChange={(event) => {

              setRating(
                event.target.value
              );

              setPage(1);

            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-500"
          >

            <option value="">
              All Ratings
            </option>

            <option value="5">
              ★★★★★ 5 Stars
            </option>

            <option value="4">
              ★★★★ 4 Stars
            </option>

            <option value="3">
              ★★★ 3 Stars
            </option>

            <option value="2">
              ★★ 2 Stars
            </option>

            <option value="1">
              ★ 1 Star
            </option>

          </select>


          <button
            type="button"
            onClick={
              submitSearch
            }
            className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-black"
          >

            Search

          </button>


          {hasFilters && (

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >

              Clear

            </button>

          )}

        </div>

      </div>


      {/* ================================================================ */}
      {/* REVIEWS                                                          */}
      {/* ================================================================ */}

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">


        {loading ? (

          <div className="divide-y divide-gray-100">

            {[1, 2, 3].map(
              (item) => (

                <div
                  key={item}
                  className="animate-pulse p-6"
                >

                  <div className="h-4 w-32 rounded bg-gray-100" />

                  <div className="mt-4 h-5 w-64 rounded bg-gray-100" />

                  <div className="mt-3 h-4 w-full max-w-2xl rounded bg-gray-100" />

                  <div className="mt-2 h-4 w-2/3 rounded bg-gray-100" />

                </div>

              )
            )}

          </div>

        ) : reviews.length === 0 ? (

          <div className="p-16 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">

              <MessageSquare
                size={24}
                className="text-gray-300"
              />

            </div>


            <h2 className="mt-4 font-semibold text-gray-900">

              No reviews found

            </h2>


            <p className="mt-1 text-sm text-gray-500">

              {hasFilters
                ? "Try changing your search or filters."
                : "Customer reviews will appear here."
              }

            </p>


            {hasFilters && (

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >

                Clear Filters

              </button>

            )}

          </div>

        ) : (

          <div className="divide-y divide-gray-100">

            {reviews.map(
              (review) => (

                <article
                  key={review.id}
                  className="p-5 transition hover:bg-gray-50/50 sm:p-6"
                >

                  <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">


                    {/* ================================================= */}
                    {/* CONTENT                                             */}
                    {/* ================================================= */}

                    <div className="min-w-0 flex-1">


                      {/* Rating + Status */}

                      <div className="flex flex-wrap items-center gap-3">

                        {renderStars(
                          review.rating
                        )}


                        <StatusBadge
                          status={
                            review.status
                          }
                        />


                        <span className="text-xs text-gray-400">

                          {formatDate(
                            review.created_at
                          )}

                        </span>

                      </div>


                      {/* Title */}

                      <h2 className="mt-3 text-base font-semibold text-gray-900">

                        {review.title ||
                          "Customer review"}

                      </h2>


                      {/* Product */}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">

                        <span className="font-medium text-gray-700">

                          {review.product?.name ||
                            "Product"}

                        </span>


                        <span>
                          ·
                        </span>


                        <span>

                          {review.user?.name ||
                            "Customer"}

                        </span>


                        {review.user?.email && (

                          <>

                            <span>
                              ·
                            </span>

                            <span>
                              {
                                review.user.email
                              }
                            </span>

                          </>

                        )}

                      </div>


                      {/* Comment */}

                      {review.comment && (

                        <p className="mt-4 max-w-4xl text-sm leading-6 text-gray-600">

                          {review.comment}

                        </p>

                      )}

                    </div>


                    {/* ================================================= */}
                    {/* ACTIONS                                             */}
                    {/* ================================================= */}

                    <div className="flex shrink-0 flex-wrap items-start gap-2">


                      {review.status !==
                        "approved" && (

                        <button
                          type="button"
                          disabled={
                            actionId ===
                            review.id
                          }
                          onClick={() =>
                            void updateReview(
                              review,
                              "approved"
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                        >

                          <Check
                            size={14}
                          />

                          Approve

                        </button>

                      )}


                      {review.status !==
                        "rejected" && (

                        <button
                          type="button"
                          disabled={
                            actionId ===
                            review.id
                          }
                          onClick={() =>
                            void updateReview(
                              review,
                              "rejected"
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >

                          <X
                            size={14}
                          />

                          Reject

                        </button>

                      )}


                      <button
                        type="button"
                        disabled={
                          actionId ===
                          review.id
                        }
                        onClick={() =>
                          void deleteReview(
                            review
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                      >

                        <Trash2
                          size={14}
                        />

                        Delete

                      </button>

                    </div>

                  </div>

                </article>

              )
            )}

          </div>

        )}

      </div>


      {/* ================================================================ */}
      {/* PAGINATION                                                       */}
      {/* ================================================================ */}

      {!loading &&
        pagination.total > 0 && (

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm text-gray-500">

            Showing{" "}

            <span className="font-medium text-gray-700">

              {pageInfo}

            </span>

          </p>


          {pagination.last_page >
            1 && (

            <div className="flex items-center gap-2">


              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    value =>
                      value - 1
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <ChevronLeft
                  size={16}
                />

                Previous

              </button>


              <span className="px-3 text-sm text-gray-500">

                Page{" "}

                <strong className="text-gray-800">

                  {pagination.current_page}

                </strong>

                {" "}of{" "}

                <strong className="text-gray-800">

                  {pagination.last_page}

                </strong>

              </span>


              <button
                type="button"
                disabled={
                  page >=
                  pagination.last_page
                }
                onClick={() =>
                  setPage(
                    value =>
                      value + 1
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >

                Next

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          )}

        </div>

      )}

    </div>

  );

}


/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({
  label,
  value,
  icon,
  valueClass = "text-gray-900",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  valueClass?: string;
}) {

  return (

    <div className="rounded-2xl border border-gray-200 bg-white p-5">

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-500">

          {label}

        </p>


        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500">

          {icon}

        </div>

      </div>


      <p
        className={`mt-3 text-2xl font-semibold ${valueClass}`}
      >

        {value.toLocaleString(
          "en-IN"
        )}

      </p>

    </div>

  );

}


/*
|--------------------------------------------------------------------------
| Status Badge
|--------------------------------------------------------------------------
*/

function StatusBadge({
  status,
}: {
  status: ReviewStatus;
}) {

  const styles = {

    approved:
      "bg-green-50 text-green-700",

    rejected:
      "bg-red-50 text-red-700",

    pending:
      "bg-amber-50 text-amber-700",

  };


  return (

    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${styles[status]}`}
    >

      {status}

    </span>

  );

}