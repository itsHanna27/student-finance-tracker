import { useState } from "react";
import "../css/Community.css";
import Navbar from "../Navbar/Navbar";
import Bestie from "../Modal/bestie";
import useFinanceData from "../hooks/FinanceData";


const posts = [
  {
    id: 1,
    name: "Lily Smith",
    avatar: "LS",
    title: "Cashback Apps Are a Game Changer",
    text: "I started using cashback apps whenever I shop online — it adds up fast!",
    likes: 37,
    dislikes: 2,
  },
  {
    id: 2,
    name: "John Doe",
    avatar: "JD",
    title: "Automate Your Savings Every Week",
    text: "Every Sunday, I've got a standing order that moves £10 straight into my savings. Honestly, I barely notice it, but by the end of the semester it turns into a decent chunk of money. Such an easy habit that makes saving feel effortless!",
    likes: 65,
    dislikes: 1,
  },
  {
    id: 3,
    name: "Jane Doe",
    avatar: "JD",
    title: "Split Bills With a Screenshot System",
    text: "We split our utilities evenly each month and whoever pays uploads a screenshot. Simple and transparent. p.s I love this website!!!!",
    likes: 20,
    dislikes: 1,
  },
  {
    id: 4,
    name: "Mike Rod",
    avatar: "MR",
    title: "Cook With Flatmates to Cut Costs",
    text: "Cooking with flatmates once a week helped me save on groceries and we all eat better.",
    likes: 349,
    dislikes: 28,
  },
  {
    id: 5,
    name: "Emma Jane",
    avatar: "EJ",
    title: "Skip the Coffee Shop",
    text: "I make my coffee at home now. £2 saved per day = £60 a month 😄",
    likes: 205,
    dislikes: 28,
  },
  {
    id: 6,
    name: "Molly Mae",
    avatar: "MM",
    title: "Use Your Uni Printer — It's Free",
    text: "If you need to print stuff for classes, always use your university library printer instead of the one in town. Most unis give you free print credits each semester, and even when they don't, it's still way cheaper than local shops.",
    likes: 10,
    dislikes: 1,
  },
  {
    id: 7,
    name: "Daniel Rodd",
    avatar: "DR",
    title: "Too Good To Go = Cheap Amazing Food",
    text: "Download Too Good To Go — restaurants and cafes sell leftover food at a huge discount near closing time. I've had amazing meals for under £3!",
    likes: 88,
    dislikes: 3,
  },
  {
    id: 8,
    name: "Sophie Turner",
    avatar: "ST",
    title: "Free Software With Your Student Email",
    text: "Check if your uni has a free Microsoft Office 365 subscription for students. Also Adobe Creative Cloud is often discounted by 60%+ with a student email.",
    likes: 142,
    dislikes: 5,
  },
  {
    id: 9,
    name: "Amir Khan",
    avatar: "AK",
    title: "Set Up a Guilt-Free Treat Account",
    text: "Set up a separate 'treat' account with £20/month. You can spend it guilt-free on takeaways or nights out knowing your main budget is untouched.",
    likes: 73,
    dislikes: 4,
  },
];

function Avatar2({ initials }) {
  return <div className="avatar2">{initials}</div>;
}

function Card({ post }) {
  const [likes, setLikes] = useState(post.likes);
  const [dislikes, setDislikes] = useState(post.dislikes);
  const [voted, setVoted] = useState(null);

  const handleLike = () => {
    if (voted === "like") {
      setLikes((l) => l - 1);
      setVoted(null);
    } else {
      setLikes((l) => l + 1);
      if (voted === "dislike") setDislikes((d) => d - 1);
      setVoted("like");
    }
  };

  const handleDislike = () => {
    if (voted === "dislike") {
      setDislikes((d) => d - 1);
      setVoted(null);
    } else {
      setDislikes((d) => d + 1);
      if (voted === "like") setLikes((l) => l - 1);
      setVoted("dislike");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <Avatar2 initials={post.avatar} />
        <span className="card-name">{post.name}</span>
      </div>
      <p className="card-title">{post.title}</p>
      <p className="card-text">"{post.text}"</p>
      <div className="card-actions">
        <div className="vote-group">
          <button
            className={`vote-btn${voted === "like" ? " liked" : ""}`}
            onClick={handleLike}
          >
            <i className="fa-solid fa-thumbs-up"></i> {likes}
          </button>
          <button
            className={`vote-btn${voted === "dislike" ? " disliked" : ""}`}
            onClick={handleDislike}
          >
            <i className="fa-solid fa-thumbs-down"></i> {dislikes}
          </button>
        </div>
        <button className="vote-btn comment-btn">
          <i className="fa-regular fa-comment"></i> Comment
        </button>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const [titleInput, setTitleInput] = useState("");
  const [input, setInput] = useState("");
  const [allPosts, setAllPosts] = useState(posts);
  const [search, setSearch] = useState("");

  const {
    transactions,
    savingGoals,
    budgetGoals,
    balance,
    userId,
  } = useFinanceData();

  const filtered = allPosts.filter(
    (p) =>
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handlePost = () => {
    if (!input.trim() || !titleInput.trim()) return;
    setAllPosts((prev) => [
      {
        id: Date.now(),
        name: "You",
        avatar: "ME",
        title: titleInput.trim(),
        text: input.trim(),
        likes: 0,
        dislikes: 0,
      },
      ...prev,
    ]);
    setTitleInput("");
    setInput("");
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
            Explore how students like you budget, save, and stay on top of uni life and share
            your own advice, stories, and money-saving hacks.
          </p>
        </div>

        <div className="community-container">
          <div className="search-wrapper">
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ask questions or share your best budgeting hacks!"
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
              <button className="post-btn" onClick={handlePost}>
                Post
              </button>
            </div>
          </div>

          <div className="posts-grid">
            {filtered.map((post) => (
              <Card key={post.id} post={post} />
            ))}
            {filtered.length === 0 && (
              <div className="no-results">No posts found matching "{search}"</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}