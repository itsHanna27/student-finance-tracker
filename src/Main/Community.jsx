import { useState, useEffect } from "react";
import "../css/Community.css";
import Navbar from "../Navbar/Navbar";
import Bestie from "../Modal/bestie";
import useFinanceData from "../hooks/FinanceData";

const API = "http://localhost:5000";

const isUrl = (str) => typeof str === "string" && str.startsWith("http");

function Avatar2({ name, avatar }) {
  const initials = name?.slice(0, 2).toUpperCase();
  return (
    <div className="avatar2">
      {isUrl(avatar) ? (
        <img src={avatar} alt={initials} onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        initials
      )}
    </div>
  );
}

function CommentSection({ postId, comments: initialComments, userId }) {
  const [comments, setComments] = useState(initialComments || []);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: commentText.trim() }),
      });
      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch (err) {
      console.error("Comment error:", err);
    }
    setLoading(false);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await fetch(`${API}/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  return (
    <div className="comment-section">
      <div className="comment-list">
        {comments.map((c, i) => (
          <div key={c._id || i} className="comment-item">
            <Avatar2 name={c.name} avatar={c.avatar} />
            <div className="comment-body">
              <span className="comment-name">{c.name}</span>
              <p className="comment-text">{c.text}</p>
            </div>
            {c.userId?.toString() === userId?.toString() && (
              <button
                className="delete-comment-btn"
                onClick={() => handleDeleteComment(c._id)}
                title="Delete comment"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className="no-comments">No comments yet. Be the first!</p>
        )}
      </div>
      <div className="comment-input-row">
        <input
          className="comment-input"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button className="send-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

function Card({ post, userId, onDelete }) {
  const [likes, setLikes] = useState(post.likes?.length ?? 0);
  const [dislikes, setDislikes] = useState(post.dislikes?.length ?? 0);
  const [voted, setVoted] = useState(
    post.likes?.includes(userId) ? "like" : post.dislikes?.includes(userId) ? "dislike" : null
  );
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    try {
      const res = await fetch(`${API}/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setVoted((prev) => (prev === "like" ? null : "like"));
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  const handleDislike = async () => {
    try {
      const res = await fetch(`${API}/api/posts/${post._id}/dislike`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setVoted((prev) => (prev === "dislike" ? null : "dislike"));
    } catch (err) {
      console.error("Dislike error:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await fetch(`${API}/api/posts/${post._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      onDelete(post._id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="card">
      {/* Header — no delete button here */}
      <div className="card-header">
        <Avatar2 name={post.name} avatar={post.avatar} />
        <span className="card-name">{post.name}</span>
      </div>

      <p className="card-title">{post.title}</p>
      <p className="card-text">"{post.text}"</p>

      <div className="card-actions">
        <div className="vote-group">
          <button className={`vote-btn${voted === "like" ? " liked" : ""}`} onClick={handleLike}>
            <i className="fa-solid fa-thumbs-up"></i> {likes}
          </button>
          <button className={`vote-btn${voted === "dislike" ? " disliked" : ""}`} onClick={handleDislike}>
            <i className="fa-solid fa-thumbs-down"></i> {dislikes}
          </button>
        </div>
        <button
          className={`vote-btn comment-btn${showComments ? " active" : ""}`}
          onClick={() => setShowComments((v) => !v)}
        >
          <i className="fa-regular fa-comment"></i> {post.comments?.length ?? 0}
        </button>
      </div>

      {showComments && (
        <CommentSection postId={post._id} comments={post.comments} userId={userId} />
      )}

      {/* Delete button at the very bottom of the card */}
      {post.userId?.toString() === userId?.toString() && (
        <button className="deletebtn" onClick={handleDelete} title="Delete post">
          <i className="fa-solid fa-trash"></i>
        </button>
      )}
    </div>
  );
}

export default function CommunityPage() {
  const [titleInput, setTitleInput] = useState("");
  const [input, setInput] = useState("");
  const [allPosts, setAllPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("community");
  const [friendIds, setFriendIds] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id;

  const { transactions, savingGoals, budgetGoals, balance } = useFinanceData();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API}/api/posts`);
        const data = await res.json();
        setAllPosts(data);
      } catch (err) {
        console.error("Fetch posts error:", err);
      }
      setLoadingPosts(false);
    };
    const fetchFriends = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`${API}/user/${userId}`);
        const data = await res.json();
        setFriendIds(data.friends?.map((f) => f.toString()) || []);
      } catch (err) {
        console.error("Fetch friends error:", err);
      }
    };
    fetchPosts();
    fetchFriends();
  }, [userId]);

  const tabFiltered = allPosts.filter((p) => {
    if (activeTab === "mine") return p.userId?.toString() === userId?.toString();
    if (activeTab === "friends") return friendIds.includes(p.userId?.toString());
    return true;
  });

  const filtered = tabFiltered.filter(
    (p) =>
      p.text?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handlePost = async () => {
    if (!input.trim() || !titleInput.trim() || !userId) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, title: titleInput.trim(), text: input.trim() }),
      });
      const newPost = await res.json();
      setAllPosts((prev) => [newPost, ...prev]);
      setTitleInput("");
      setInput("");
    } catch (err) {
      console.error("Post error:", err);
    }
    setPosting(false);
  };

  const handleDelete = (postId) => {
    setAllPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
        }
        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          z-index: -1;
        }
      `}</style>
      <Navbar />
      <Bestie
        balance={balance}
        transactions={transactions}
        savingGoals={savingGoals}
        budgetGoals={budgetGoals}
        userId={userId}
      />
      <div className="community-page">
        <div className="community-header">
          <h1 className="community-title">Community Page</h1>
          <p className="community-subtitle">
            Explore how students like you budget, save, and stay on top of uni life and share your own advice, stories, and money-saving hacks.</p>
        </div>

        <div className="community-container">
          <div className="search-wrapper">
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by title, name, or content..."
            />
          </div>

          <p className="compose-label">Ask or share a tip</p>
          <div className="compose-box">
            <input
              className="compose-title-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Enter the title of your post"
            />
            <textarea
              className="compose-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask questions or share your best budgeting hacks!"
              rows={3}
            />
            <div className="compose-footer">
              <button className="post-btn" onClick={handlePost} disabled={posting}>
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

          {loadingPosts ? (
            <p className="loading-posts">Loading posts...</p>
          ) : (
            <>
              <div className="tabs">
                <button className={`tab-btn${activeTab === "mine" ? " active-tab" : ""}`} onClick={() => setActiveTab("mine")}>My Posts</button>
                <button className={`tab-btn${activeTab === "friends" ? " active-tab" : ""}`} onClick={() => setActiveTab("friends")}>Friends Posts</button>
                <button className={`tab-btn${activeTab === "community" ? " active-tab" : ""}`} onClick={() => setActiveTab("community")}>Community Posts</button>
              </div>
              <div className="posts-grid">
                {filtered.map((post) => (
                  <Card key={post._id} post={post} userId={userId} onDelete={handleDelete} />
                ))}
                {filtered.length === 0 && (
                  <div className="no-results">
                    No posts found{search ? ` matching "${search}"` : " in this tab"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}