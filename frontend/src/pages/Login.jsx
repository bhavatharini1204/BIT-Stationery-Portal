import { useState } from "react";
import {
  login,
  registerStudent,
} from "../api";

function Login({ onLogin }) {
  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [name, setName] =
    useState("");

  const [registerNumber, setRegisterNumber] =
    useState("");

  const [department, setDepartment] =
    useState("");

  const [semester, setSemester] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  function switchMode(nextMode) {
    setMode(nextMode);

    setError("");
    setSuccess("");

    setEmail("");
    setPassword("");
    setName("");
    setRegisterNumber("");
    setDepartment("");
    setSemester("");
    setConfirmPassword("");
  }


  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await login(
          email,
          password
        );

      onLogin(result.user);

    } catch (error) {
      setError(
        error.message ||
          "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }


  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /* --------------------------------
       BASIC VALIDATION
    -------------------------------- */

    if (
      !name ||
      !registerNumber ||
      !email ||
      !department ||
      !semester ||
      !password ||
      !confirmPassword
    ) {
      setError(
        "Please fill all registration fields."
      );
      return;
    }


    /* --------------------------------
       COLLEGE EMAIL
    -------------------------------- */

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const collegeEmailPattern =
      /^[a-z0-9._%+-]+@bitsathy\.ac\.in$/i;

    if (
      !collegeEmailPattern.test(
        normalizedEmail
      )
    ) {
      setError(
        "Please use your valid college email ending with @bitsathy.ac.in."
      );
      return;
    }


    /* --------------------------------
       PASSWORD
    -------------------------------- */

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }


    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }


    try {
      setLoading(true);

      const result =
        await registerStudent({
          name:
            name.trim(),

          email:
            normalizedEmail,

          password,

          department:
            department
              .trim()
              .toUpperCase(),

          semester:
            Number(semester),

          registerNumber:
            registerNumber
              .trim()
              .toUpperCase(),
        });


      setSuccess(
        result.message ||
          "Student account created successfully."
      );

      /*
       * Do not automatically log the student in.
       * Send them back to Login so they can
       * verify the newly created account.
       */

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setMode("login");

        setPassword("");
        setConfirmPassword("");
      }, 1200);

    } catch (error) {
      setError(
        error.message ||
          "Unable to create student account."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-page">

      {/* =====================================
          BRAND
      ===================================== */}

      <div className="login-brand">

        <div className="brand-mark">
          BIT
        </div>

        <div>

          <h1>
            BIT Stationery Portal
          </h1>

          <p>
            Campus Stationery Management
          </p>

        </div>

      </div>


      {/* =====================================
          LOGIN
      ===================================== */}

      {mode === "login" && (

        <div className="login-card">

          <p className="eyebrow">
            SECURE ACCESS
          </p>

          <h2>
            Welcome back
          </h2>

          <p className="muted">
            Sign in to continue to your
            dashboard.
          </p>


          <form
            onSubmit={handleLogin}
          >

            <label htmlFor="login-email">
              College Email
            </label>

            <input
              id="login-email"
              type="email"
              placeholder="Enter your college email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />


            <label htmlFor="login-password">
              Password
            </label>

            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />


            {error && (
              <div className="error-box">
                {error}
              </div>
            )}


            {success && (
              <div className="success-box">
                {success}
              </div>
            )}


            <div
              style={{
                marginTop: "22px",
              }}
            >

              <button
                type="submit"
                className="primary-btn full"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

            </div>

          </form>


          {/* REGISTER LINK */}

          <div
            style={{
              marginTop: "22px",
              textAlign: "center",
            }}
          >

            <p className="muted">
              New student?
            </p>

            <button
              type="button"
              className="secondary-btn"
              onClick={() =>
                switchMode("register")
              }
            >
              Create Student Account
            </button>

          </div>


          {/* STAFF INFORMATION */}

          <div className="login-test-info">

            <strong>
              Staff access
            </strong>

            <p>
              HOD, Technician,
              Storeperson and Admin
              accounts are created by
              the Admin.
            </p>

            <p>
              Students must register
              using their college email.
            </p>

          </div>

        </div>

      )}


      {/* =====================================
          STUDENT REGISTRATION
      ===================================== */}

      {mode === "register" && (

        <div className="login-card">

          <p className="eyebrow">
            STUDENT REGISTRATION
          </p>

          <h2>
            Create your account
          </h2>

          <p className="muted">
            Register using your official
            Bannari Amman Institute of
            Technology email.
          </p>


          <form
            onSubmit={handleRegister}
          >

            {/* NAME */}

            <label htmlFor="student-name">
              Full Name
            </label>

            <input
              id="student-name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
            />


            {/* REGISTER NUMBER */}

            <label htmlFor="register-number">
              Register Number
            </label>

            <input
              id="register-number"
              type="text"
              placeholder="Enter your register number"
              value={registerNumber}
              onChange={(event) =>
                setRegisterNumber(
                  event.target.value
                )
              }
            />


            {/* EMAIL */}

            <label htmlFor="student-email">
              College Email
            </label>

            <input
              id="student-email"
              type="email"
              placeholder="abc.cs23@bitsathy.ac.in"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
            />

            <small
              className="muted"
              style={{
                display: "block",
                marginTop: "6px",
              }}
            >
              Use your official
              @bitsathy.ac.in email.
            </small>


            {/* DEPARTMENT */}

            <label htmlFor="department">
              Department
            </label>

            <select
              id="department"
              value={department}
              onChange={(event) =>
                setDepartment(
                  event.target.value
                )
              }
            >

              <option value="">
                Select Department
              </option>

              <option value="CSE">
                CSE
              </option>

              <option value="ECE">
                ECE
              </option>

              <option value="EEE">
                EEE
              </option>

              <option value="MECH">
                MECH
              </option>

              <option value="CIVIL">
                CIVIL
              </option>

              <option value="IT">
                IT
              </option>

              <option value="AIDS">
                AIDS
              </option>

              <option value="AIML">
                AIML
              </option>

            </select>


            {/* SEMESTER */}

            <label htmlFor="semester">
              Current Semester
            </label>

            <select
              id="semester"
              value={semester}
              onChange={(event) =>
                setSemester(
                  event.target.value
                )
              }
            >

              <option value="">
                Select Semester
              </option>

              <option value="1">
                Semester 1
              </option>

              <option value="2">
                Semester 2
              </option>

              <option value="3">
                Semester 3
              </option>

              <option value="4">
                Semester 4
              </option>

              <option value="5">
                Semester 5
              </option>

              <option value="6">
                Semester 6
              </option>

              <option value="7">
                Semester 7
              </option>

              <option value="8">
                Semester 8
              </option>

            </select>


            {/* PASSWORD */}

            <label htmlFor="student-password">
              Password
            </label>

            <input
              id="student-password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />


            {/* CONFIRM PASSWORD */}

            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <input
              id="confirm-password"
              type="password"
              placeholder="Re-enter your password"
              value={
                confirmPassword
              }
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
            />


            {/* ERRORS */}

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}


            {success && (
              <div className="success-box">
                {success}
              </div>
            )}


            <div
              style={{
                marginTop: "22px",
              }}
            >

              <button
                type="submit"
                className="primary-btn full"
                disabled={loading}
              >
                {loading
                  ? "Creating Account..."
                  : "Create Student Account"}
              </button>

            </div>

          </form>


          {/* BACK TO LOGIN */}

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >

            <button
              type="button"
              className="ghost-btn"
              onClick={() =>
                switchMode("login")
              }
            >
              ← Back to Login
            </button>

          </div>


          <div className="login-test-info">

            <strong>
              Registration rule
            </strong>

            <p>
              Only official
              @bitsathy.ac.in email
              addresses are accepted.
            </p>

            <p>
              Your department and semester
              determine which HOD and
              Technician manage your
              stationery distribution.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}

export default Login;