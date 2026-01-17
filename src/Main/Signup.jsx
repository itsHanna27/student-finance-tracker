import React, { useState, useEffect } from "react";
import { FaUserCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";


const Signup = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const [hover, setHover] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);
 // ✅ Add handleSignUp here
 const handleSignUp = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        surname,
        email,
        password,
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      alert(msg);
      return;
    }

    // ✅ SUCCESS → redirect to dashboard
    navigate("/dashboard");

  } catch (err) {
    console.error(err);
    alert("Signup failed");
  }
};

  return (
    <>
      {/* FULL PAGE BACKGROUND FIX */}
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          background: linear-gradient(46deg, #122753, #0F0F1A) !important;
          height: 100%;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
        }
      `}</style>

      <div className="login-page" style={styles.container}>
        <div className="login-container" style={styles.loginContainer}>
          <FaUserCircle size={100} color="#fff" />

          <form style={styles.form} onSubmit={handleSignUp}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Surname"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              style={styles.input}
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />

            {/* Password field wrapper FIXED */}
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...styles.input,
                  paddingRight: "50px",
                }}
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <p style={styles.signupText}>
              Already have an account?
              <Link to="/login" style={styles.signupLink}> Log in </Link>
            </p>

            <button
              type="submit"
              style={{
                ...styles.button,
                backgroundColor: hover ? "#0f1735ff" : "#02062B",
                transform: hover ? "scale(1.03)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Sign up
            </button>
          </form>
        </div>

        {/* AUTOFILL FIXES */}
        <style>{`
          input {
            color: #fff;
            caret-color: #fff;
            background-color: #01041E;
          }
input[type="password"]::-webkit-textfield-decoration-container {
    display: none;
}
input[type="password"]::-ms-reveal {
    display: none;
}

          input::selection {
            background-color: #1F2F6E;
            color: #fff;
          }

          input:-webkit-autofill {
            -webkit-box-shadow: 0 0 0px 1000px #01041E inset !important;
            -webkit-text-fill-color: #fff !important;
          }
        `}</style>
      </div>
    </>
  );
};


const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
  },

loginContainer: {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",

  width: "400px",
  height: "550px",       // ★ grows if needed, but doesn't blow up

  background: "#0B1534",
  border: "1px solid #1F2F6E",
  borderRadius: "30px",
  padding: "40px 20px",

  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
},



  form: {
    marginTop: "35px",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    alignItems: "center",
  },

  input: {
    backgroundColor: "#01041E",
    padding: "15px",
    borderRadius: "10px",
    border: "1px solid #01041E",
    fontSize: "18px",
    color: "#fff",
    width: "90%",
    height:"30%"
  },

  passwordWrapper: {
    position: "relative",
    width: "97%",
    display: "flex",
    justifyContent: "center",
  },

  eyeIcon: {
    position: "absolute",
    right: "15px",
    top: "40%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#ccc",
  },

  signupText: {
    color: "#ccc",
    fontSize: "14px",
    alignSelf: "flex-start",
    paddingLeft: "10px",
  },

  signupLink: {
    color: "#9D89E2",
    paddingLeft: "5px",
  },

  button: {
    padding: "13px",
    borderRadius: "15px",
    backgroundColor: "#02062B",
    color: "#fff",
    fontSize: "20px",
    width: "70%",
    fontWeight: "bold",
    border: "1px solid #1F2F6E",
    display: "flex",
    justifyContent: "center",
    cursor:"pointer"
  },
};

export default Signup;
