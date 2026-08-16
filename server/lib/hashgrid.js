module.exports = class HashGrid {
	static stride = 1 << 16;
	static maxCellVisits = 1024;

	cells = new Map();
	largeEntities = new Set();
	allEntities = new Set();
	constructor(cellSize) {
		this.cellSize = cellSize;
	}

	insert(entity, minX, minY, maxX, maxY) {
		if (![minX, minY, maxX, maxY].every(Number.isFinite)) return;
		this.allEntities.add(entity);
		const startX = minX >> this.cellSize;
		const startY = minY >> this.cellSize;
		const endX = maxX >> this.cellSize;
		const endY = maxY >> this.cellSize;
		const cellCount = (endX - startX + 1) * (endY - startY + 1);
		if (cellCount > HashGrid.maxCellVisits) {
			this.largeEntities.add(entity);
			return;
		}
		for (let x = startX; x <= endX; x++) {
			for (let y = startY; y <= endY; y++) {
				const key = x + y * HashGrid.stride;
				const cell = this.cells.get(key);
				if (cell === undefined) {
					this.cells.set(key, [entity]);
				} else {
					cell.push(entity);
				}
			}
		}
	}

	query(minX, minY, maxX, maxY) {
		const cells = this.cells;
		const cellSize = this.cellSize;
		const stride = HashGrid.stride;

		const output = new Set();
		if (![minX, minY, maxX, maxY].every(Number.isFinite)) return output;
		const startX = minX >> cellSize;
		const startY = minY >> cellSize;
		const endX = maxX >> cellSize;
		const endY = maxY >> cellSize;
		const cellCount = (endX - startX + 1) * (endY - startY + 1);
		if (cellCount > HashGrid.maxCellVisits) {
			for (const entity of this.allEntities) {
				if (
					!entity.bond &&
					entity.minX < maxX && entity.maxX > minX &&
					entity.minY < maxY && entity.maxY > minY
				) {
					output.add(entity);
				}
			}
		} else {
			for (let x = startX; x <= endX; x++) {
				for (let y = startY; y <= endY; y++) {
					const key = x + y * stride;
					const cell = cells.get(key);
					if (cell !== undefined) {
						for (const entity of cell) {
							if (entity.bond) continue;
							if (entity.minX < maxX && entity.maxX > minX && entity.minY < maxY && entity.maxY > minY) {
								output.add(entity);
							}
						}
					}
				}
			}
		}
		for (const entity of this.largeEntities) {
			if (
				!entity.bond &&
				entity.minX < maxX && entity.maxX > minX &&
				entity.minY < maxY && entity.maxY > minY
			) {
				output.add(entity);
			}
		}
		return output;
	}

	clear() {
		this.cells.clear();
		this.largeEntities.clear();
		this.allEntities.clear();
	}
}
