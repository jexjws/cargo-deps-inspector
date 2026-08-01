fn main() -> anyhow::Result<()> {
    cargo_inspector_adapter::initialize();
    println!("{}", cargo_inspector_core::workspace_name());
    Ok(())
}
