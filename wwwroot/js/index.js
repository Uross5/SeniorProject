
    function athleteForm() {
        // Implementation for creating athlete form
        return `
        <form id="athleteForm">
            <h1> Create Athlete Form </h1>
            <label for="name">Name:</label><br>
            <input type="text" id="name" name="name" placeholder="Enter athlete's name"><br>

            <label for="age">Age:</label><br>
            <input type="number" id="age" name="age" placeholder="Enter athlete's age"><br>

            <label for="position">Position:</label><br>
            <select id="position" name="position" placeholder="Select athlete's position">
                <option value="" selected disabled hidden>Select Position</option>
                <option value="PG">Point Guard</option>
                <option value="SG">Shooting Guard</option>
                <option value="SF">Small Forward</option>
                <option value="PF">Power Forward</option>
                <option value="C">Center</option>
            </select><br>

            <label for="team">Team:</label><br>
            <input type="text" id="team" name="team" placeholder="Enter athlete's team"><br>

            <label for="pointsPerGame">Points Per Game:</label><br>
            <input type="number" id="pointsPerGame" name="pointsPerGame" placeholder="Ex: 17.2" step="0.1"><br>

            <label for="assistPerGame">Assists Per Game:</label><br>
            <input type="number" id="assistPerGame" name="assistPerGame" placeholder="Ex: 5.3" step="0.1"><br>

            <label for="reboundsPerGame">Rebounds Per Game:</label><br>
            <input type="number" id="reboundsPerGame" name="reboundsPerGame" placeholder="Ex: 8.1" step="0.1"><br>
                <input type="submit" value="Submit">
        </form>
        `;
    }
    let athleteForm2= document.getElementById("athleteForm");

    athleteForm2.addEventListener("submit", function(e){
        e.preventDefault();
        const name = document.getElementById("name").value;
        const age = document.getElementById("age").value;
        const position = document.getElementById("position").value;
        const team = document.getElementById("team").value;
        const pointsPerGame = document.getElementById("pointsPerGame").value;
        const assistPerGame = document.getElementById("assistPerGame").value;
        const reboundsPerGame = document.getElementById("reboundsPerGame").value;
        console.log("Athlete Created:");
        console.log("Name: " + name);
        console.log("Age: " + age);
        console.log("Position: " + position);
        console.log("Team: " + team);
        console.log("Points Per Game: " + pointsPerGame);
        console.log("Assists Per Game: " + assistPerGame);
        console.log("Rebounds Per Game: " + reboundsPerGame);
    })

    function gameForm() {
    document.getElementById("athleteForm").innerHTML = athleteForm();
    }

    