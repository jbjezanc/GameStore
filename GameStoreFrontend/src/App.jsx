import { useEffect, useState } from "react";
import { createGame, deleteGame, fetchGame, fetchGames, fetchGenres, updateGame } from "./api/games";

const EMPTY_FORM = {
  name: "",
  genreId: "",
  price: "",
  releaseDate: ""
};

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15.1 5.1l3.8 3.8M5 19l3.5-.8L18.2 8.4a1.8 1.8 0 0 0 0-2.5l-.2-.2a1.8 1.8 0 0 0-2.5 0L5.8 15.5 5 19z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(price);
}

function formatDate(value) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US").format(date);
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function compareText(left, right) {
  return (left ?? "").localeCompare(right ?? "", undefined, {
    sensitivity: "base"
  });
}

function compareDate(left, right) {
  const leftTime = Date.parse(left ?? "");
  const rightTime = Date.parse(right ?? "");
  const leftIsValid = Number.isFinite(leftTime);
  const rightIsValid = Number.isFinite(rightTime);

  if (leftIsValid && rightIsValid) {
    return leftTime - rightTime;
  }

  if (leftIsValid) {
    return 1;
  }

  if (rightIsValid) {
    return -1;
  }

  return compareText(left, right);
}

function compareGames(leftGame, rightGame, key) {
  switch (key) {
    case "name":
      return compareText(leftGame.name, rightGame.name);
    case "genre":
      return compareText(leftGame.genre, rightGame.genre);
    case "price":
      return (leftGame.price ?? 0) - (rightGame.price ?? 0);
    case "releaseDate":
      return compareDate(leftGame.releaseDate, rightGame.releaseDate);
    default:
      return 0;
  }
}

function getSortedGames(games, sortConfig) {
  if (!sortConfig.key) {
    return games;
  }

  return [...games].sort((leftGame, rightGame) => {
    const comparison = compareGames(leftGame, rightGame, sortConfig.key);
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
}

export default function App() {
  const [games, setGames] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenresLoading, setIsGenresLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dialogMode, setDialogMode] = useState(null);
  const [activeGame, setActiveGame] = useState(null);
  const [formValues, setFormValues] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc"
  });

  async function loadGames({ preserveSuccess = false } = {}) {
    setIsLoading(true);
    setErrorMessage("");

    if (!preserveSuccess) {
      setSuccessMessage("");
    }

    try {
      const result = await fetchGames();
      setGames(result.games);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load games."));
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadGenres() {
    setIsGenresLoading(true);

    try {
      const items = await fetchGenres();
      setGenres(items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load genres."));
      setGenres([]);
    } finally {
      setIsGenresLoading(false);
    }
  }

  useEffect(() => {
    loadGames();
    loadGenres();
  }, []);

  function closeDialog() {
    setDialogMode(null);
    setActiveGame(null);
    setFormValues(EMPTY_FORM);
    setIsSubmitting(false);
  }

  function openCreateDialog() {
    setSuccessMessage("");
    setErrorMessage("");
    setActiveGame(null);
    setFormValues(EMPTY_FORM);
    setDialogMode("create");
  }

  async function openEditDialog(game) {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const gameToEdit = await fetchGame(game.id);

      setActiveGame(gameToEdit);
      setFormValues({
        name: gameToEdit.name,
        genreId: String(gameToEdit.genreId),
        price: String(gameToEdit.price ?? ""),
        releaseDate: toDateInputValue(gameToEdit.releaseDate)
      });
      setDialogMode("edit");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to load game details for editing."));
    }
  }

  function openDeleteDialog(game) {
    setSuccessMessage("");
    setErrorMessage("");
    setActiveGame(game);
    setDialogMode("delete");
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    const payload = {
      name: formValues.name.trim(),
      genreId: formValues.genreId,
      price: formValues.price,
      releaseDate: formValues.releaseDate
    };

    if (!payload.name || !payload.genreId || !payload.price || !payload.releaseDate) {
      setErrorMessage("Please fill in all fields before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (dialogMode === "create") {
        await createGame(payload);
        setSuccessMessage("Game created successfully.");
      } else if (dialogMode === "edit" && activeGame) {
        await updateGame(activeGame.id, payload);
        setSuccessMessage("Game updated successfully.");
      }

      closeDialog();
      await loadGames({ preserveSuccess: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save the game."));
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!activeGame) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await deleteGame(activeGame.id);
      setSuccessMessage("Game deleted successfully.");
      closeDialog();
      await loadGames({ preserveSuccess: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete the game."));
      setIsSubmitting(false);
    }
  }

  function handleSort(key) {
    setSortConfig((currentSort) => {
      if (currentSort.key === key) {
        return {
          key,
          direction: currentSort.direction === "asc" ? "desc" : "asc"
        };
      }

      return {
        key,
        direction: "asc"
      };
    });
  }

  function getAriaSort(key) {
    if (sortConfig.key !== key) {
      return "none";
    }

    return sortConfig.direction === "asc" ? "ascending" : "descending";
  }

  function renderSortIndicator(key) {
    const isActive = sortConfig.key === key;
    const symbol = !isActive ? "▲" : sortConfig.direction === "asc" ? "▲" : "▼";

    return (
      <span className={`sort-indicator${isActive ? " sort-indicator--active" : ""}`} aria-hidden="true">
        {symbol}
      </span>
    );
  }

  const isFormDialogOpen = dialogMode === "create" || dialogMode === "edit";
  const dialogTitle = dialogMode === "edit" ? "Edit Game" : "New Game";
  const submitLabel = dialogMode === "edit" ? "Save Changes" : "Create Game";
  const genrePlaceholder = isGenresLoading
    ? "Loading genres..."
    : genres.length === 0
      ? "No genres available"
      : "Select a genre";
  const sortedGames = getSortedGames(games, sortConfig);

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="topbar__inner">
          <h1>Game Store</h1>
        </div>
      </header>

      <main className="content">
        <section className="toolbar">
          <button type="button" className="primary-button" onClick={openCreateDialog}>
            New Game
          </button>
          {successMessage ? <p className="status-note status-note--success">{successMessage}</p> : null}
          {errorMessage ? <p className="status-note status-note--error">{errorMessage}</p> : null}
        </section>

        <section className="table-card" aria-busy={isLoading}>
          <div className="table-scroll">
            <table className="games-table">
              <thead>
                <tr>
                  <th aria-sort={getAriaSort("name")}>
                    <button type="button" className="column-sort-button" onClick={() => handleSort("name")}>
                      <span>Name</span>
                      {renderSortIndicator("name")}
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("genre")}>
                    <button type="button" className="column-sort-button" onClick={() => handleSort("genre")}>
                      <span>Genre</span>
                      {renderSortIndicator("genre")}
                    </button>
                  </th>
                  <th className="numeric" aria-sort={getAriaSort("price")}>
                    <button type="button" className="column-sort-button column-sort-button--numeric" onClick={() => handleSort("price")}>
                      <span>Price</span>
                      {renderSortIndicator("price")}
                    </button>
                  </th>
                  <th aria-sort={getAriaSort("releaseDate")}>
                    <button type="button" className="column-sort-button" onClick={() => handleSort("releaseDate")}>
                      <span>Release Date</span>
                      {renderSortIndicator("releaseDate")}
                    </button>
                  </th>
                  <th className="actions-column">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedGames.map((game) => (
                  <tr key={game.id}>
                    <td>{game.name}</td>
                    <td>{game.genre}</td>
                    <td className="numeric">{formatPrice(game.price)}</td>
                    <td>{formatDate(game.releaseDate)}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="icon-button icon-button--edit"
                        aria-label={`Edit ${game.name}`}
                        onClick={() => openEditDialog(game)}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--delete"
                        aria-label={`Delete ${game.name}`}
                        onClick={() => openDeleteDialog(game)}
                      >
                        <DeleteIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && games.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      No games found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {isFormDialogOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeDialog}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="game-dialog-title">{dialogTitle}</h2>
              <button type="button" className="modal-close" aria-label="Close dialog" onClick={closeDialog}>
                ×
              </button>
            </div>

            <form className="game-form" onSubmit={handleSave}>
              <label className="field">
                <span>Name</span>
                <input name="name" value={formValues.name} onChange={handleFieldChange} placeholder="Super Mario Bros. Wonder" />
              </label>

              <label className="field">
                <span>Genre</span>
                <select
                  name="genreId"
                  value={formValues.genreId}
                  onChange={handleFieldChange}
                  disabled={isGenresLoading || genres.length === 0}
                >
                  <option value="">{genrePlaceholder}</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Price</span>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formValues.price}
                  onChange={handleFieldChange}
                  placeholder="59.99"
                />
              </label>

              <label className="field">
                <span>Release Date</span>
                <input name="releaseDate" type="date" value={formValues.releaseDate} onChange={handleFieldChange} />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeDialog} disabled={isSubmitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isSubmitting || isGenresLoading || genres.length === 0}
                >
                  {isSubmitting ? "Saving..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {dialogMode === "delete" && activeGame ? (
        <div className="modal-backdrop" role="presentation" onClick={closeDialog}>
          <div
            className="modal-card modal-card--compact"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="delete-dialog-title">Delete Game</h2>
              <button type="button" className="modal-close" aria-label="Close dialog" onClick={closeDialog}>
                ×
              </button>
            </div>

            <p className="delete-copy">
              Are you sure you want to delete <strong>{activeGame.name}</strong>?
            </p>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={handleDelete} disabled={isSubmitting}>
                {isSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
