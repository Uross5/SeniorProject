document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("loginForm");
    const errorMessage = document.getElementById("errorMessage");});

    loginForm.addEventListener("submit", function(event) {
        event.preventDefault(); // Prevent form from submitting normally
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value; 
        const role = document.getElementById("role").value;
        console.log("Username:", username);
        console.log("Password:", password);
        console.log("Role selected:", role);
        // Send login data to the server
    });