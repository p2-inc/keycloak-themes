package io.phasetwo.keycloak.themes.theme;

import static java.nio.file.StandardWatchEventKinds.*;

import java.io.IOException;
import java.nio.file.*;
import java.util.Optional;
import lombok.extern.jbosslog.JBossLog;

@JBossLog
public class DirectoryWatcher implements Runnable {

  private final Path directory;
  private final WatchService watchService;
  private final FileEventListener listener;
  private final String fileType;
  private boolean running = true; // Control flag for the while loop

  public DirectoryWatcher(Path directory, FileEventListener listener, String fileType)
      throws IOException {
    this.directory = directory;
    this.listener = listener;
    this.fileType = fileType;
    this.watchService = FileSystems.getDefault().newWatchService();
    registerDirectories(directory);
  }

  private void registerDirectories(Path directory) throws IOException {
    registerDirectory(directory);
    Files.list(directory)
        .forEach(
            file -> {
              log.debugf("Visited %s", file);
              try {
                if (Files.isDirectory(file)) {
                  registerDirectory(file);
                }
              } catch (Exception ignore) {
              }
            });
  }

  // Register the directory to listen for file creation, modification, and directory creation
  private void registerDirectory(Path dir) throws IOException {
    dir.register(watchService, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);
    log.infof("Registered directory: %s", dir);
  }

  public void run() {
    try {
      while (running) {
        WatchKey key;
        try {
          key = watchService.take(); // Wait for an event
        } catch (InterruptedException ex) {
          log.info("Watcher interrupted");
          return;
        }

        for (WatchEvent<?> event : key.pollEvents()) {
          WatchEvent.Kind<?> kind = event.kind();

          // If an overflow event occurs, we can skip it
          if (kind == OVERFLOW) {
            continue;
          }

          // Retrieve the file/directory name that caused the event
          Path dir = (Path) key.watchable();
          Path eventPath = (Path) event.context();
          Path fullPath = dir.resolve(eventPath);

          log.infof("File event [%s] %s %s", kind, eventPath, fullPath);
          // If the event concerns a directory
          if (Files.isDirectory(fullPath) && kind == ENTRY_CREATE) {
            try {
              // Register the new directory to watch for file creation/modification within it
              registerDirectory(fullPath);
            } catch (IOException e) {
              log.warnf(e, "Failed to register new directory: %s", fullPath);
            }
          } else {
            // If the event concerns a file of the given type (created or modified)
            if (fullPath.toString().endsWith(fileType)) {
              // Determine if the file is in a subdirectory
              Optional<String> subDirName = Optional.empty();
              if (!fullPath.getParent().equals(directory)) {
                subDirName = Optional.of(directory.relativize(fullPath.getParent()).toString());
              }

              if (kind == ENTRY_CREATE) {
              } else if (kind == ENTRY_MODIFY) {
                listener.onFileModified(subDirName, fullPath);
              } else if (kind == ENTRY_DELETE) {
                listener.onFileRemoved(subDirName, fullPath);
              }
            }
          }
        }

        // Reset the key to continue receiving events
        boolean valid = key.reset();
        if (!valid) {
          break; // Exit if the directory is no longer accessible
        }
      }
    } finally {
      stopWatching();
    }
  }

  public boolean isRunning() {
    return running;
  }

  // Method to stop the watcher and close the WatchService
  public void stopWatching() {
    running = false;
    try {
      watchService.close(); // Closes the watch service and releases resources
      log.info("WatchService closed.");
    } catch (IOException e) {
      log.warn("Error closing directory watcher.", e);
    }
  }

  // Listener interface with a single method for handling file events
  public interface FileEventListener {
    void onFileModified(Optional<String> dir, Path file);

    void onFileRemoved(Optional<String> dir, Path file);
  }
}
