async function displayBacklinks(baseUrl) {
	const backlinkContainer = document.getElementById("backlinks-container");
	if (!backlinkContainer) return;

	try {
		const { index, content } = await fetchData;

		// Get current page path
		const cleanUrl = window.location.origin + window.location.pathname;
		let curPage = cleanUrl.replace(/\/$/g, "").replace(baseUrl, "");

		// If empty, it's the home page
		if (!curPage || curPage === "") {
			curPage = "/";
		}

		// Get backlinks for current page
		const backlinks = index.backlinks[curPage] || [];

		const backlinksList = backlinkContainer.querySelector("ul.backlinks");
		backlinksList.innerHTML = "";

		if (backlinks.length === 0) {
			const li = document.createElement("li");
			li.textContent = "No backlinks found.";
			backlinksList.appendChild(li);
			return;
		}

		// Display each backlink
		backlinks.forEach((backlink) => {
			const li = document.createElement("li");
			const a = document.createElement("a");

			// Get the source page path and convert to URL
			let source = backlink.source;
			if (source.startsWith("/")) {
				source = source.substring(1);
			}

			// Construct URL
			let fullUrl;
			if (baseUrl && baseUrl !== "/") {
				fullUrl = `${baseUrl.replace(/\/$/, "")}/${source}/`;
			} else {
				fullUrl = `/${source}/`;
			}

			// Clean up double slashes
			fullUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");

			a.href = fullUrl;
			a.className = "internal-link";
			a.setAttribute("data-ctx", backlink.text);
			a.setAttribute("data-src", source);

			// Get the title from content index
			const sourceContent = content[backlink.source];
			const title = sourceContent?.title || backlink.source;

			a.textContent = title + " ";

			// Add context span if available
			if (backlink.text) {
				const contextSpan = document.createElement("span");
				contextSpan.className = "context";
				contextSpan.textContent = `(${backlink.text})`;
				a.appendChild(contextSpan);
			}

			li.appendChild(a);
			backlinksList.appendChild(li);
		});
	} catch (error) {
		console.error("Error loading backlinks:", error);
		const backlinksList = backlinkContainer.querySelector("ul.backlinks");
		backlinksList.innerHTML = "<li>Error loading backlinks.</li>";
	}
}
