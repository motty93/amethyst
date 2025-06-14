async function drawGraph(baseUrl, isHome, pathColors, graphConfig) {
	let {
		depth,
		enableDrag,
		enableLegend,
		enableZoom,
		opacityScale,
		scale,
		repelForce,
		fontSize,
	} = graphConfig;

	const container = document.getElementById("graph-container");
	const { index, links, content } = await fetchData;

	// Use .pathname to remove hashes / searchParams / text fragments
	const cleanUrl = window.location.origin + window.location.pathname;

	const curPage = cleanUrl.replace(/\/$/g, "").replace(baseUrl, "");

	const parseIdsFromLinks = (links) => [
		...new Set(links.flatMap((link) => [link.source, link.target])),
	];

	// Links is mutated by d3. We want to use links later on, so we make a copy and pass that one to d3
	// Note: shallow cloning does not work because it copies over references from the original array
	const copyLinks = JSON.parse(JSON.stringify(links));

	const neighbours = new Set();
	const wl = [curPage || "/", "__SENTINEL"];
	if (depth >= 0) {
		while (depth >= 0 && wl.length > 0) {
			// compute neighbours
			const cur = wl.shift();
			if (cur === "__SENTINEL") {
				depth--;
				wl.push("__SENTINEL");
			} else {
				neighbours.add(cur);
				const outgoing = index.links[cur] || [];
				const incoming = index.backlinks[cur] || [];
				wl.push(
					...outgoing.map((l) => l.target),
					...incoming.map((l) => l.source),
				);
			}
		}
	} else {
		parseIdsFromLinks(copyLinks).forEach((id) => neighbours.add(id));
	}

	const data = {
		nodes: [...neighbours].map((id) => ({ id })),
		links: copyLinks.filter(
			(l) => neighbours.has(l.source) && neighbours.has(l.target),
		),
	};

	const color = (d) => {
		if (d.id === curPage || (d.id === "/" && curPage === "")) {
			return "var(--g-node-active)";
		}

		for (const pathColor of pathColors) {
			const path = Object.keys(pathColor)[0];
			const colour = pathColor[path];
			if (d.id.startsWith(path)) {
				return colour;
			}
		}

		return "var(--g-node)";
	};

	const drag = (simulation) => {
		function dragstarted(event, d) {
			if (!event.active) simulation.alphaTarget(1).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(event, d) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragended(event, d) {
			if (!event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		const noop = () => {};
		return d3
			.drag()
			.on("start", enableDrag ? dragstarted : noop)
			.on("drag", enableDrag ? dragged : noop)
			.on("end", enableDrag ? dragended : noop);
	};

	const height = Math.max(container.offsetHeight, isHome ? 500 : 250);
	const width = container.offsetWidth;

	const simulation = d3
		.forceSimulation(data.nodes)
		.force("charge", d3.forceManyBody().strength(-100 * repelForce))
		.force(
			"link",
			d3
				.forceLink(data.links)
				.id((d) => d.id)
				.distance(40),
		)
		.force("center", d3.forceCenter());

	const svg = d3
		.select("#graph-container")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("viewBox", [
			-width / 2 / scale,
			-height / 2 / scale,
			width / scale,
			height / scale,
		])
		.attr("xmlns", "http://www.w3.org/2000/svg")
		.attr("xml:lang", "ja");

	if (enableLegend) {
		const legend = [
			{ Current: "var(--g-node-active)" },
			{ Note: "var(--g-node)" },
			...pathColors,
		];
		legend.forEach((legendEntry, i) => {
			const key = Object.keys(legendEntry)[0];
			const colour = legendEntry[key];
			svg
				.append("circle")
				.attr("cx", -width / 2 + 20)
				.attr("cy", height / 2 - 30 * (i + 1))
				.attr("r", 6)
				.style("fill", colour);
			svg
				.append("text")
				.attr("x", -width / 2 + 40)
				.attr("y", height / 2 - 30 * (i + 1))
				.text(key)
				.style("font-size", "15px")
				.style(
					"font-family",
					'-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
				)
				.attr("alignment-baseline", "middle");
		});
	}

	// draw links between nodes
	const link = svg
		.append("g")
		.selectAll("line")
		.data(data.links)
		.join("line")
		.attr("class", "link")
		.attr("stroke", "var(--g-link)")
		.attr("stroke-width", 2)
		.attr("data-source", (d) => d.source.id)
		.attr("data-target", (d) => d.target.id);

	// svg groups
	const graphNode = svg
		.append("g")
		.selectAll("g")
		.data(data.nodes)
		.enter()
		.append("g");

	// calculate radius
	const nodeRadius = (d) => {
		const numOut = index.links[d.id]?.length || 0;
		const numIn = index.backlinks[d.id]?.length || 0;
		return 2 + Math.sqrt(numOut + numIn);
	};

	// draw individual nodes
	const node = graphNode
		.append("circle")
		.attr("class", "node")
		.attr("id", (d) => d.id)
		.attr("r", nodeRadius)
		.attr("fill", color)
		.style("cursor", "pointer")
		.on("click", (_, d) => {
			// SPA navigation
			let url = decodeURI(d.id).toLowerCase().replace(/\s+/g, "-");
			// Remove leading slash if present
			if (url.startsWith("/")) {
				url = url.substring(1);
			}
			// Construct URL safely
			let fullUrl;
			if (baseUrl && baseUrl !== "/") {
				fullUrl = `${baseUrl.replace(/\/$/, "")}/${url}/`;
			} else {
				fullUrl = `/${url}/`;
			}
			window.Million.navigate(
				new URL(fullUrl, window.location.origin),
				".singlePage",
			);
		})
		.on("mouseover", function (_, d) {
			d3.selectAll(".node")
				.transition()
				.duration(100)
				.attr("fill", "var(--g-node-inactive)");

			const neighbours = parseIdsFromLinks([
				...(index.links[d.id] || []),
				...(index.backlinks[d.id] || []),
			]);
			const neighbourNodes = d3
				.selectAll(".node")
				.filter((d) => neighbours.includes(d.id));
			const currentId = d.id;
			let prefetchUrl = decodeURI(d.id).toLowerCase().replace(/\s+/g, "-");
			if (prefetchUrl.startsWith("/")) {
				prefetchUrl = prefetchUrl.substring(1);
			}
			// Construct prefetch URL safely
			let fullPrefetchUrl;
			if (baseUrl && baseUrl !== "/") {
				fullPrefetchUrl = `${baseUrl.replace(/\/$/, "")}/${prefetchUrl}/`;
			} else {
				fullPrefetchUrl = `/${prefetchUrl}/`;
			}
			window.Million.prefetch(new URL(fullPrefetchUrl, window.location.origin));
			const linkNodes = d3
				.selectAll(".link")
				.filter((d) => d.source.id === currentId || d.target.id === currentId);

			// highlight neighbour nodes
			neighbourNodes.transition().duration(200).attr("fill", color);

			// highlight links
			linkNodes
				.transition()
				.duration(200)
				.attr("stroke", "var(--g-link-active)");

			const bigFont = fontSize * 1.5;

			// show text for self
			d3.select(this.parentNode)
				.raise()
				.select("text")
				.transition()
				.duration(200)
				.attr(
					"opacityOld",
					d3.select(this.parentNode).select("text").style("opacity"),
				)
				.style("opacity", 1)
				.style("font-size", bigFont + "em")
				.attr("dy", (d) => nodeRadius(d) + 20 + "px"); // radius is in px
		})
		.on("mouseleave", function (_, d) {
			d3.selectAll(".node").transition().duration(200).attr("fill", color);

			const currentId = d.id;
			const linkNodes = d3
				.selectAll(".link")
				.filter((d) => d.source.id === currentId || d.target.id === currentId);

			linkNodes.transition().duration(200).attr("stroke", "var(--g-link)");

			d3.select(this.parentNode)
				.select("text")
				.transition()
				.duration(200)
				.style(
					"opacity",
					d3.select(this.parentNode).select("text").attr("opacityOld"),
				)
				.style("font-size", fontSize + "em")
				.attr("dy", (d) => nodeRadius(d) + 8 + "px"); // radius is in px
		})
		.call(drag(simulation));

	// draw labels
	const labels = graphNode
		.append("text")
		.attr("dx", 0)
		.attr("dy", (d) => nodeRadius(d) + 8 + "px")
		.attr("text-anchor", "middle")
		.text((d) => {
			if (content[d.id]?.title) {
				return content[d.id].title;
			}
			// Fallback: decode URL encoding and clean up the path
			let title = decodeURIComponent(d.id);
			// Remove path prefixes
			title = title.replace(/^\/02_notes\/|^\//, "");
			// Replace dashes with spaces and clean up timestamp
			title = title.replace(/^\d{12}\s*[-\s]*/, "").replace(/-/g, " ");
			return title || d.id;
		})
		.style("opacity", (opacityScale - 1) / 3.75)
		.style("pointer-events", "none")
		.style("font-size", fontSize + "em")
		.style(
			"font-family",
			'-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
		)
		.raise()
		.call(drag(simulation));

	// set panning

	if (enableZoom) {
		svg.call(
			d3
				.zoom()
				.extent([
					[0, 0],
					[width, height],
				])
				.scaleExtent([0.25, 4])
				.on("zoom", ({ transform }) => {
					link.attr("transform", transform);
					node.attr("transform", transform);
					const scale = transform.k * opacityScale;
					const scaledOpacity = Math.max((scale - 1) / 3.75, 0);
					labels.attr("transform", transform).style("opacity", scaledOpacity);
				}),
		);
	}

	// progress the simulation
	simulation.on("tick", () => {
		link
			.attr("x1", (d) => d.source.x)
			.attr("y1", (d) => d.source.y)
			.attr("x2", (d) => d.target.x)
			.attr("y2", (d) => d.target.y);
		node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
		labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
	});
}
