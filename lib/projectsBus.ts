/**
 * Projects Bus - Simple pub/sub utility for project data changes
 * Used to notify components when project data is updated
 */

type ProjectsChangeCallback = () => void;

class ProjectsBus {
    private listeners: Set<ProjectsChangeCallback> = new Set();

    /**
     * Subscribe to projects data changes
     * @param callback Function to call when projects data changes
     * @returns Unsubscribe function
     */
    onProjectsChanged(callback: ProjectsChangeCallback): () => void {
        this.listeners.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Emit projects data change event
     * Calls all registered listeners
     */
    emitProjectsChanged(): void {
        this.listeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in projects change callback:', error);
            }
        });
    }

    /**
     * Get the number of active listeners
     */
    getListenerCount(): number {
        return this.listeners.size;
    }

    /**
     * Clear all listeners (useful for cleanup)
     */
    clear(): void {
        this.listeners.clear();
    }
}

// Create singleton instance
const projectsBus = new ProjectsBus();

// Export convenience functions
export const onProjectsChanged = (callback: ProjectsChangeCallback) =>
    projectsBus.onProjectsChanged(callback);

export const emitProjectsChanged = () =>
    projectsBus.emitProjectsChanged();

// Export the bus instance for advanced usage
export { projectsBus };

// Export types
export type { ProjectsChangeCallback };
