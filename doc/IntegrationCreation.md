## Integration Creation
Integrating a new platform into Kassy is a relatively simple process. It can be thought of as a special kind of module that provides I/O for Kassy.

Each integration must be in its own javascript file located within the directory `core/output`. If additional files are required for an output module they must not be located within this directory or a subdirectory of it - this is to ensure that Kassy can accurately search for new integrations.

### Methods
Each integration must provide the following methods:
